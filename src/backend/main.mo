import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";



actor {

  // ── Types ──────────────────────────────────────────────────────────────────

  public type UserRole = { #admin; #user; #guest };

  public type PaymentStatus = { #pending; #active; #expired };

  public type PaymentProof = {
    filePath : Text;
    fileType : Text;
    uploadedAt : Int;
  };

  public type UserProfile = {
    name : Text;
    registrationTime : Int;
    paymentStatus : PaymentStatus;
    paymentProof : ?PaymentProof;
  };

  public type QuestionType  = { #singleChoice; #multiSelect; #trueFalse; #numeric };
  public type QuestionState = { #draft; #published; #archived };

  public type Question = {
    id : Text;
    content : Text;
    options : [Text];
    correctAnswers : [Nat];
    explanation : Text;
    questionType : QuestionType;
    domain : Text;
    state : QuestionState;
    version : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  public type PaymentMethod = { #stcBank; #localBank };

  public type PaymentRecord = {
    id : Text;
    user : Principal;
    amount : Nat;
    method : PaymentMethod;
    status : PaymentStatus;
    createdAt : Int;
    updatedAt : Int;
    proof : ?PaymentProof;
  };

  public type Comment = {
    id : Text;
    user : Principal;
    questionId : Text;
    content : Text;
    approved : Bool;
    createdAt : Int;
  };

  public type PaymentConfiguration = {
    stcPayBarcodePath : ?Text;
    localBankDetails : ?Text;
    updatedAt : Int;
  };

  public type UserStats = {
    totalUsers : Nat;
    newUsersLast24h : Nat;
    newUsersLast7d : Nat;
    newUsersLast30d : Nat;
  };

  public type UserActivity = {
    user : Principal;
    loginCount : Nat;
    questionAttempts : Nat;
    commentCount : Nat;
    lastLogin : Int;
  };

  public type StudyMode = { #practice; #timed; #review };

  public type StudentProgress = {
    completedQuestions : Nat;
    correctAnswers : Nat;
    totalAttempts : Nat;
    accuracy : Float;
    weakAreas : [Text];
    streak : Nat;
    badges : [Text];
  };

  public type Bookmark = {
    user : Principal;
    questionId : Text;
    createdAt : Int;
  };

  public type StudyStatistics = {
    practiceModeStats : ModeStats;
    timedModeStats : ModeStats;
    reviewModeStats : ModeStats;
    aggregateStats : AggregateStats;
  };

  public type ModeStats = {
    questionsAttempted : Nat;
    questionsCorrect : Nat;
    accuracyPercentage : Float;
    timeSpent : Int;
    sessionsCompleted : Nat;
  };

  public type AggregateStats = {
    totalQuestionsAttempted : Nat;
    totalQuestionsCorrect : Nat;
    overallAccuracy : Float;
    totalTimeSpent : Int;
    totalSessionsCompleted : Nat;
  };

  public type BrandAssets = {
    logoPath : ?Text;
    soundPath : ?Text;
    updatedAt : Int;
  };

  public type CsvImportResult = {
    success : Bool;
    message : Text;
    importedCount : Nat;
    errors : [Text];
  };

  // Simplified domain record — no subjects, no topics
  public type Domain = {
    id : Text;
    name : Text;
    createdAt : Int;
  };

  public type CsvPreview = {
    headers : [Text];
    rows : [[Text]];
    validationResults : [ValidationResult];
    delimiter : Text;
    importMode : ?ImportMode;
  };

  public type ValidationResult = {
    rowIndex : Nat;
    isValid : Bool;
    errors : [Text];
  };

  public type ImportMode = { #questions; #users; #other };

  public type AiAssistantConfig = {
    apiKey : Text;
    enabled : Bool;
    lastUpdated : Int;
  };

  public type AiChatMessage = {
    role : Text;
    content : Text;
  };

  public type AiChatRequest = {
    messages : [AiChatMessage];
  };

  // ── State ──────────────────────────────────────────────────────────────────

  var firstUserInitialized : Bool = false;
  let userRoles       = Map.empty<Principal, UserRole>();
  let userProfiles    = Map.empty<Principal, UserProfile>();
  let questions       = Map.empty<Text, Question>();
  let paymentRecords  = Map.empty<Text, PaymentRecord>();
  let comments        = Map.empty<Text, Comment>();
  let userActivities  = Map.empty<Principal, UserActivity>();
  let studentProgress = Map.empty<Principal, StudentProgress>();
  let bookmarks       = Map.empty<Text, Bookmark>();
  let studyStatistics = Map.empty<Principal, StudyStatistics>();

  // CSV previews — persistent Map so data survives canister restarts
  let csvPreviews = Map.empty<Text, CsvPreview>();

  var paymentConfiguration : ?PaymentConfiguration = null;
  var brandAssets : ?BrandAssets = null;
  var aiAssistantConfig : ?AiAssistantConfig = null;

  // ── Five fixed domains (no subject/topic hierarchy) ───────────────────────

  let fixedDomains : [Domain] = [
    { id = "surgery";           name = "Surgery";           createdAt = 0 },
    { id = "obgyn";             name = "OBGYN";             createdAt = 0 },
    { id = "internal-medicine"; name = "Internal Medicine"; createdAt = 0 },
    { id = "pediatrics";        name = "Pediatrics";        createdAt = 0 },
    { id = "ethics";            name = "Ethics";            createdAt = 0 },
  ];

  // ── Access control helpers ─────────────────────────────────────────────────

  func getRole(caller : Principal) : UserRole {
    switch (userRoles.get(caller)) {
      case (?role) role;
      case null #guest;
    };
  };

  func isAdmin(caller : Principal) : Bool {
    getRole(caller) == #admin;
  };

  func isUser(caller : Principal) : Bool {
    let role = getRole(caller);
    role == #user or role == #admin;
  };

  func requireAdmin(caller : Principal) {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  func requireUser(caller : Principal) {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
  };

  func hasActivePayment(user : Principal) : Bool {
    switch (userProfiles.get(user)) {
      case null false;
      case (?profile) profile.paymentStatus == #active;
    };
  };

  // ── Auth / roles ───────────────────────────────────────────────────────────

  /// First user to call this becomes admin. Subsequent calls are no-ops.
  public shared ({ caller }) func initializeAccessControl() : async () {
    if (not firstUserInitialized) {
      userRoles.add(caller, #admin);
      firstUserInitialized := true;
    };
  };

  public query ({ caller }) func getCallerUserRole() : async UserRole {
    getRole(caller);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    isAdmin(caller);
  };

  /// Register the caller as a user (if not already assigned a role).
  public shared ({ caller }) func registerUser(name : Text) : async () {
    switch (userRoles.get(caller)) {
      case (?_) {}; // already has a role — no-op
      case null {
        userRoles.add(caller, #user);
        let profile : UserProfile = {
          name;
          registrationTime = Time.now();
          paymentStatus = #pending;
          paymentProof = null;
        };
        userProfiles.add(caller, profile);
      };
    };
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : UserRole) : async () {
    requireAdmin(caller);
    // Admins cannot demote other admins or themselves
    switch (userRoles.get(user)) {
      case (?#admin) Runtime.trap("Cannot change the role of an admin");
      case _ userRoles.add(user, role);
    };
  };

  // ── User profiles ──────────────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireUser(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireUser(caller);
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    requireAdmin(caller);
    userProfiles.toArray();
  };

  public query ({ caller }) func getUserStats() : async UserStats {
    requireAdmin(caller);

    let now = Time.now();
    let dayInNanos : Int  =         24 * 60 * 60 * 1_000_000_000;
    let weekInNanos : Int =      7 * 24 * 60 * 60 * 1_000_000_000;
    let monthInNanos : Int = 30 * 24 * 60 * 60 * 1_000_000_000;

    var totalUsers    = 0;
    var last24h       = 0;
    var last7d        = 0;
    var last30d       = 0;

    for ((_, profile) in userProfiles.entries()) {
      totalUsers += 1;
      let age : Int = now - profile.registrationTime;
      if (age <= dayInNanos)   { last24h += 1 };
      if (age <= weekInNanos)  { last7d  += 1 };
      if (age <= monthInNanos) { last30d += 1 };
    };

    { totalUsers; newUsersLast24h = last24h; newUsersLast7d = last7d; newUsersLast30d = last30d };
  };

  // ── Questions ──────────────────────────────────────────────────────────────

  func allPublishedQuestions() : [Question] {
    let result = List.empty<Question>();
    for ((_, q) in questions.entries()) {
      if (q.state == #published) { result.add(q) };
    };
    result.toArray();
  };

  public query ({ caller }) func getQuestions() : async [Question] {
    requireUser(caller);
    if (not isAdmin(caller) and not hasActivePayment(caller)) {
      Runtime.trap("Payment required: Please complete payment to access questions");
    };
    let result = List.empty<Question>();
    for ((_, q) in questions.entries()) { result.add(q) };
    result.toArray();
  };

  public query ({ caller }) func getAllQuestions() : async [Question] {
    requireAdmin(caller);
    let result = List.empty<Question>();
    for ((_, q) in questions.entries()) { result.add(q) };
    result.toArray();
  };

  public shared ({ caller }) func addQuestion(question : Question) : async () {
    requireAdmin(caller);
    questions.add(question.id, question);
  };

  public shared ({ caller }) func updateQuestion(question : Question) : async () {
    requireAdmin(caller);
    questions.add(question.id, question);
  };

  public shared ({ caller }) func deleteQuestion(questionId : Text) : async () {
    requireAdmin(caller);
    questions.remove(questionId);
  };

  public query ({ caller }) func getQuestionsByMode(mode : StudyMode) : async [Question] {
    requireUser(caller);
    if (not isAdmin(caller) and not hasActivePayment(caller)) {
      Runtime.trap("Payment required: Please complete payment to access questions");
    };
    let _ = mode;
    allPublishedQuestions();
  };

  public query ({ caller }) func getQuestionsByFilter(domain : ?Text, difficulty : ?Text) : async [Question] {
    requireUser(caller);
    if (not isAdmin(caller) and not hasActivePayment(caller)) {
      Runtime.trap("Payment required: Please complete payment to access questions");
    };
    let _ = difficulty;
    let result = List.empty<Question>();
    for ((_, q) in questions.entries()) {
      let domainMatch = switch (domain) {
        case null true;
        case (?d) q.domain == d;
      };
      if (domainMatch) { result.add(q) };
    };
    result.toArray();
  };

  public query ({ caller }) func searchQuestions(searchTerm : Text) : async [Question] {
    requireUser(caller);
    if (not isAdmin(caller) and not hasActivePayment(caller)) {
      Runtime.trap("Payment required: Please complete payment to access questions");
    };
    let lower = searchTerm.toLower();
    let result = List.empty<Question>();
    for ((_, q) in questions.entries()) {
      if (q.content.toLower().contains(#text (lower))) { result.add(q) };
    };
    result.toArray();
  };

  public query ({ caller }) func getQuestionsWithDomains() : async [Question] {
    requireAdmin(caller);
    let result = List.empty<Question>();
    for ((_, q) in questions.entries()) {
      if (q.domain != "") { result.add(q) };
    };
    result.toArray();
  };

  public query ({ caller }) func getOrphanQuestions() : async [Question] {
    requireAdmin(caller);
    let result = List.empty<Question>();
    for ((_, q) in questions.entries()) {
      var found = false;
      for (d in fixedDomains.vals()) {
        if (d.id == q.domain or d.name == q.domain) { found := true };
      };
      if (not found) { result.add(q) };
    };
    result.toArray();
  };

  // ── Domains (fixed 5, no subjects) ────────────────────────────────────────

  public query ({ caller }) func getDomains() : async [Domain] {
    requireUser(caller);
    fixedDomains;
  };

  public query ({ caller }) func getAllDomains() : async [Domain] {
    requireAdmin(caller);
    fixedDomains;
  };

  // ── Payments ───────────────────────────────────────────────────────────────

  public query ({ caller }) func getPaymentRecords() : async [PaymentRecord] {
    requireAdmin(caller);
    let result = List.empty<PaymentRecord>();
    for ((_, r) in paymentRecords.entries()) { result.add(r) };
    result.toArray();
  };

  public shared ({ caller }) func addPaymentRecord(record : PaymentRecord) : async () {
    requireAdmin(caller);
    paymentRecords.add(record.id, record);
  };

  public shared ({ caller }) func updatePaymentRecord(record : PaymentRecord) : async () {
    requireAdmin(caller);
    paymentRecords.add(record.id, record);
  };

  public shared ({ caller }) func uploadPaymentProof(paymentRecordId : Text, filePath : Text, fileType : Text) : async () {
    switch (getRole(caller)) {
      case (#guest)  Runtime.trap("Authentication required: Please log in to upload payment proof");
      case (#admin)  Runtime.trap("Unauthorized: Only students can upload payment proof");
      case (#user) {
        let proof : PaymentProof = { filePath; fileType; uploadedAt = Time.now() };
        let record : PaymentRecord = switch (paymentRecords.get(paymentRecordId)) {
          case null {
            {
              id = paymentRecordId;
              user = caller;
              amount = 0;
              method = #stcBank;
              status = #pending;
              createdAt = Time.now();
              updatedAt = Time.now();
              proof = ?proof;
            };
          };
          case (?r) {
            if (r.user != caller) {
              Runtime.trap("Unauthorized: You can only upload proof for your own records");
            };
            { r with updatedAt = Time.now(); proof = ?proof };
          };
        };
        paymentRecords.add(paymentRecordId, record);
      };
    };
  };

  public shared ({ caller }) func approvePayment(paymentRecordId : Text) : async () {
    requireAdmin(caller);
    switch (paymentRecords.get(paymentRecordId)) {
      case null Runtime.trap("Payment record not found");
      case (?record) {
        paymentRecords.add(record.id, { record with status = #active; updatedAt = Time.now() });
        switch (userProfiles.get(record.user)) {
          case null {};
          case (?profile) {
            userProfiles.add(record.user, { profile with paymentStatus = #active });
          };
        };
      };
    };
  };

  public shared ({ caller }) func updatePaymentConfiguration(stcPayBarcodePath : ?Text, localBankDetails : ?Text) : async () {
    requireAdmin(caller);
    paymentConfiguration := ?{
      stcPayBarcodePath;
      localBankDetails;
      updatedAt = Time.now();
    };
  };

  public query ({ caller }) func getPaymentConfiguration() : async ?PaymentConfiguration {
    requireUser(caller);
    paymentConfiguration;
  };

  // ── Comments ───────────────────────────────────────────────────────────────

  public query ({ caller }) func getComments() : async [Comment] {
    requireUser(caller);
    let result = List.empty<Comment>();
    for ((_, c) in comments.entries()) { result.add(c) };
    result.toArray();
  };

  public shared ({ caller }) func addComment(comment : Comment) : async () {
    requireUser(caller);
    comments.add(comment.id, comment);
  };

  public shared ({ caller }) func approveComment(commentId : Text) : async () {
    requireAdmin(caller);
    switch (comments.get(commentId)) {
      case null Runtime.trap("Comment not found");
      case (?c) comments.add(c.id, { c with approved = true });
    };
  };

  public shared ({ caller }) func deleteComment(commentId : Text) : async () {
    requireAdmin(caller);
    comments.remove(commentId);
  };

  // ── User activities & progress ─────────────────────────────────────────────

  public query ({ caller }) func getUserActivities() : async [UserActivity] {
    requireAdmin(caller);
    let result = List.empty<UserActivity>();
    for ((_, a) in userActivities.entries()) { result.add(a) };
    result.toArray();
  };

  public shared ({ caller }) func updateUserActivity(loginCount : Nat, questionAttempts : Nat, commentCount : Nat, lastLogin : Int) : async () {
    requireUser(caller);
    userActivities.add(caller, { user = caller; loginCount; questionAttempts; commentCount; lastLogin });
  };

  public shared ({ caller }) func saveStudentProgress(progress : StudentProgress) : async () {
    requireUser(caller);
    studentProgress.add(caller, progress);
  };

  public query ({ caller }) func getStudentProgress() : async ?StudentProgress {
    requireUser(caller);
    studentProgress.get(caller);
  };

  public shared ({ caller }) func saveStudyStatistics(stats : StudyStatistics) : async () {
    requireUser(caller);
    studyStatistics.add(caller, stats);
  };

  public query ({ caller }) func getStudyStatistics() : async ?StudyStatistics {
    requireUser(caller);
    studyStatistics.get(caller);
  };

  // ── Bookmarks ──────────────────────────────────────────────────────────────

  public shared ({ caller }) func addBookmark(questionId : Text) : async () {
    requireUser(caller);
    let key = caller.toText() # ":" # questionId;
    bookmarks.add(key, { user = caller; questionId; createdAt = Time.now() });
  };

  public shared ({ caller }) func removeBookmark(questionId : Text) : async () {
    requireUser(caller);
    bookmarks.remove(caller.toText() # ":" # questionId);
  };

  public query ({ caller }) func getBookmarks() : async [Bookmark] {
    requireUser(caller);
    let result = List.empty<Bookmark>();
    for ((_, b) in bookmarks.entries()) {
      if (b.user == caller) { result.add(b) };
    };
    result.toArray();
  };

  // ── Brand assets ───────────────────────────────────────────────────────────

  public shared ({ caller }) func updateBrandAssets(logoPath : ?Text, soundPath : ?Text) : async () {
    requireAdmin(caller);
    brandAssets := ?{ logoPath; soundPath; updatedAt = Time.now() };
  };

  public query func getBrandAssets() : async ?BrandAssets {
    brandAssets;
  };

  // ── CSV previews (persistent) ──────────────────────────────────────────────

  func getCsvOrTrap(previewId : Text) : CsvPreview {
    switch (csvPreviews.get(previewId)) {
      case null Runtime.trap("CSV preview not found. Please re-upload the file and try again.");
      case (?p) p;
    };
  };

  public shared ({ caller }) func saveCsvPreview(previewId : Text, preview : CsvPreview) : async () {
    requireAdmin(caller);
    csvPreviews.add(previewId, preview);
  };

  public query ({ caller }) func getCsvPreview(previewId : Text) : async CsvPreview {
    requireAdmin(caller);
    getCsvOrTrap(previewId);
  };

  public shared ({ caller }) func deleteCsvPreview(previewId : Text) : async () {
    requireAdmin(caller);
    csvPreviews.remove(previewId);
  };

  public shared ({ caller }) func cancelCsvPreview(previewId : Text) : async () {
    requireAdmin(caller);
    csvPreviews.remove(previewId);
  };

  public shared ({ caller }) func updateCsvPreviewDelimiter(previewId : Text, newDelimiter : Text) : async () {
    requireAdmin(caller);
    let p = getCsvOrTrap(previewId);
    csvPreviews.add(previewId, { p with delimiter = newDelimiter });
  };

  public query ({ caller }) func getCsvPreviewDelimiter(previewId : Text) : async Text {
    requireAdmin(caller);
    getCsvOrTrap(previewId).delimiter;
  };

  public shared ({ caller }) func validateCsvPreviewDelimiter(previewId : Text) : async Bool {
    requireAdmin(caller);
    let d = getCsvOrTrap(previewId).delimiter;
    d == "," or d == ";" or d == "\t";
  };

  public shared ({ caller }) func updateCsvPreviewRows(previewId : Text, newRows : [[Text]]) : async () {
    requireAdmin(caller);
    let p = getCsvOrTrap(previewId);
    csvPreviews.add(previewId, { p with rows = newRows });
  };

  public query ({ caller }) func getCsvPreviewRows(previewId : Text) : async [[Text]] {
    requireAdmin(caller);
    getCsvOrTrap(previewId).rows;
  };

  public shared ({ caller }) func updateCsvPreviewHeaders(previewId : Text, newHeaders : [Text]) : async () {
    requireAdmin(caller);
    let p = getCsvOrTrap(previewId);
    csvPreviews.add(previewId, { p with headers = newHeaders });
  };

  public query ({ caller }) func getCsvPreviewHeaders(previewId : Text) : async [Text] {
    requireAdmin(caller);
    getCsvOrTrap(previewId).headers;
  };

  public shared ({ caller }) func updateCsvPreviewValidationResults(previewId : Text, newValidationResults : [ValidationResult]) : async () {
    requireAdmin(caller);
    let p = getCsvOrTrap(previewId);
    csvPreviews.add(previewId, { p with validationResults = newValidationResults });
  };

  public query ({ caller }) func getCsvPreviewValidationResults(previewId : Text) : async [ValidationResult] {
    requireAdmin(caller);
    getCsvOrTrap(previewId).validationResults;
  };

  public shared ({ caller }) func updateCsvPreviewImportMode(previewId : Text, newImportMode : ?ImportMode) : async () {
    requireAdmin(caller);
    let p = getCsvOrTrap(previewId);
    csvPreviews.add(previewId, { p with importMode = newImportMode });
  };

  /// Import questions from a CSV preview.
  /// Expected row columns: id | content | options (pipe-separated) | correctAnswer (0-based Nat) | explanation | _ | domain
  public shared ({ caller }) func processCsvPreview(previewId : Text) : async CsvImportResult {
    requireAdmin(caller);
    let preview = getCsvOrTrap(previewId);

    var importedCount = 0;
    let errors = List.empty<Text>();

    var rowIndex = 0;
    for (row in preview.rows.vals()) {
      if (rowIndex > 0) {
        if (row.size() >= 7) {
          let optionParts = row[2].split(#char '|').toArray();
          let correctIdx : Nat = switch (Nat.fromText(row[3])) {
            case (?n) n;
            case null 0;
          };
          let qId = if (row[0] == "") { rowIndex.toText() } else { row[0] };
          let question : Question = {
            id            = qId;
            content       = row[1];
            options       = optionParts;
            correctAnswers = [correctIdx];
            explanation   = row[4];
            questionType  = #singleChoice;
            domain        = row[6];
            state         = #published;
            version       = 1;
            createdAt     = Time.now();
            updatedAt     = Time.now();
          };
          questions.add(question.id, question);
          importedCount += 1;
        } else {
          errors.add("Invalid format on row " # (rowIndex + 1).toText());
        };
      };
      rowIndex += 1;
    };

    {
      success = errors.size() == 0;
      message = "CSV preview processed";
      importedCount;
      errors = errors.toArray();
    };
  };

  // ── AI assistant config ────────────────────────────────────────────────────

  public shared ({ caller }) func setAiAssistantConfig(apiKey : Text, enabled : Bool) : async () {
    requireAdmin(caller);
    aiAssistantConfig := ?{ apiKey; enabled; lastUpdated = Time.now() };
  };

  public query ({ caller }) func getAiAssistantConfig() : async ?AiAssistantConfig {
    requireAdmin(caller);
    aiAssistantConfig;
  };

  public query ({ caller }) func isAiAssistantEnabled() : async Bool {
    requireUser(caller);
    if (not isAdmin(caller) and not hasActivePayment(caller)) {
      Runtime.trap("Payment required: Please complete payment to access AI assistant");
    };
    switch (aiAssistantConfig) {
      case null false;
      case (?c) c.enabled;
    };
  };

  public shared ({ caller }) func deleteAiAssistantConfig() : async () {
    requireAdmin(caller);
    aiAssistantConfig := null;
  };

  // ── DeepSeek AI chat (IC HTTP outcall) ────────────────────────────────────

  public shared ({ caller }) func deepSeekChat(request : AiChatRequest) : async Text {
    requireUser(caller);
    if (not isAdmin(caller) and not hasActivePayment(caller)) {
      Runtime.trap("Payment required: Please complete payment to access AI assistant");
    };

    let config = switch (aiAssistantConfig) {
      case null Runtime.trap("AI assistant is not configured");
      case (?c) {
        if (not c.enabled) { Runtime.trap("AI assistant is currently disabled") };
        c;
      };
    };

    let bodyText = "{ \"model\": \"deepseek-chat\", \"messages\": " # encodeMessages(request.messages) # " }";

    let ic : actor {
      http_request : shared {
        url : Text;
        max_response_bytes : ?Nat64;
        method : { #get; #head; #post };
        headers : [{ name : Text; value : Text }];
        body : ?Blob;
        transform : ?{
          function : shared query {
            response : { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob };
            context : Blob;
          } -> async { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob };
          context : Blob;
        };
        is_replicated : ?Bool;
      } -> async { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob };
    } = actor ("aaaaa-aa");

    let response = await ic.http_request({
      url = "https://api.deepseek.com/v1/chat/completions";
      max_response_bytes = ?8192;
      method = #post;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "Authorization"; value = "Bearer " # config.apiKey },
      ];
      body = ?bodyText.encodeUtf8();
      transform = null;
      is_replicated = ?true;
    });

    let responseText = switch (response.body.decodeUtf8()) {
      case null { return "Error: Could not decode API response" };
      case (?t) t;
    };

    extractDeepSeekContent(responseText);
  };

  /// Extract `choices[0].message.content` from a DeepSeek JSON response.
  /// Strategy:
  ///   1. Find the "choices" key to confirm this is a valid completion response.
  ///   2. Find the last "content": key (inside the choices array).
  ///   3. Locate the opening double-quote of its string value.
  ///   4. Read chars until the closing double-quote, handling \n \t \" \\ escapes.
  private func extractDeepSeekContent(json : Text) : Text {
    let fallback = "The AI could not process your request. Please try again.";
    let contentMarker = "\"content\":";
    let quote : Char = '\"'; // ASCII 34 — straight double-quote

    if (not json.contains(#text "\"choices\"") or not json.contains(#text contentMarker)) {
      return fallback;
    };

    // Take everything after the last occurrence of "content":
    let segments = json.split(#text contentMarker).toArray();
    if (segments.size() < 2) { return fallback };

    // The last segment contains the actual message content value
    let afterMarker = segments[segments.size() - 1];
    let chars = afterMarker.toIter();

    var openFound = false;
    var finished = false;
    var prevBackslash = false;
    let buf = List.empty<Char>();

    label scan for (c in chars) {
      if (finished) { break scan };
      if (not openFound) {
        if (c == quote) { openFound := true };
      } else {
        if (prevBackslash) {
          switch (c) {
            case 'n'  { buf.add('\n') };
            case 't'  { buf.add('\t') };
            case 'r'  { buf.add('\r') };
            case '\\' { buf.add('\\') };
            case _    {
              // For \" emit just the quote; for anything else keep both chars
              if (c == quote) { buf.add(quote) }
              else { buf.add('\\'); buf.add(c) };
            };
          };
          prevBackslash := false;
        } else if (c == '\\') {
          prevBackslash := true;
        } else if (c == quote) {
          finished := true;
        } else {
          buf.add(c);
        };
      };
    };

    if (buf.size() == 0) { fallback }
    else { Text.fromIter(buf.values()) };
  };

  private func encodeMessages(messages : [AiChatMessage]) : Text {
    let parts = List.empty<Text>();
    for (m in messages.vals()) {
      // Escape backslashes first, then double-quotes, then newlines/tabs
      let escaped = m.content
        .replace(#char '\\', "\\\\")
        .replace(#text "\"", "\\\"")
        .replace(#char '\n', "\\n")
        .replace(#char '\t', "\\t");
      parts.add("{\"role\":\"" # m.role # "\",\"content\":\"" # escaped # "\"}");
    };
    // Build JSON array
    var result = "[";
    var first = true;
    for (part in parts.values()) {
      if (not first) { result := result # "," };
      result := result # part;
      first := false;
    };
    result # "]";
  };

};
