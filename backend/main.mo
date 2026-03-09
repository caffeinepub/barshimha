import AccessControl "authorization/access-control";
import Registry "blob-storage/registry";
import OutCall "http-outcalls/outcall";
import Stripe "stripe/stripe";
import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import List "mo:base/List";
import UserApproval "user-approval/approval";

actor {
  let accessControlState = AccessControl.initState();
  let registry = Registry.new();
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  let approvalState = UserApproval.initState(accessControlState);

  public type UserProfile = {
    name : Text;
    registrationTime : Int;
    paymentStatus : PaymentStatus;
    paymentProof : ?PaymentProof;
  };

  public type PaymentStatus = {
    #pending;
    #active;
    #expired;
  };

  public type PaymentProof = {
    filePath : Text;
    fileType : Text;
    uploadedAt : Int;
  };

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

  public type QuestionType = {
    #singleChoice;
    #multiSelect;
    #trueFalse;
    #numeric;
  };

  public type QuestionState = {
    #draft;
    #published;
    #archived;
  };

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

  public type PaymentMethod = {
    #stcBank;
    #localBank;
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

  public type StudyMode = {
    #practice;
    #timed;
    #review;
  };

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

  public type DomainTopic = {
    id : Text;
    name : Text;
    type_ : DomainTopicType;
    createdAt : Int;
    updatedAt : Int;
  };

  public type DomainTopicType = {
    #domain;
    #topic;
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

  public type ImportMode = {
    #questions;
    #users;
    #other;
  };

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

  public type AiChatResponse = {
    id : Text;
    objType : Text;
    created : Nat;
    model : Text;
    choices : [AiChatChoice];
    usage : ?AiChatUsage;
  };

  public type AiChatChoice = {
    index : Nat;
    message : AiChatMessage;
    finish_reason : Text;
  };

  public type AiChatUsage = {
    prompt_tokens : Nat;
    completion_tokens : Nat;
    total_tokens : Nat;
  };

  var userProfiles = principalMap.empty<UserProfile>();
  var questions = textMap.empty<Question>();
  var paymentRecords = textMap.empty<PaymentRecord>();
  var comments = textMap.empty<Comment>();
  var paymentConfiguration : ?PaymentConfiguration = null;
  var configuration : ?Stripe.StripeConfiguration = null;
  var userActivities = principalMap.empty<UserActivity>();
  var studentProgress = principalMap.empty<StudentProgress>();
  var bookmarks = textMap.empty<Bookmark>();
  var studyStatistics = principalMap.empty<StudyStatistics>();
  var brandAssets : ?BrandAssets = null;
  var domainTopics = textMap.empty<DomainTopic>();
  var csvPreviews = textMap.empty<CsvPreview>();
  var aiAssistantConfig : ?AiAssistantConfig = null;
  var firstUserInitialized : Bool = false;

  private func hasActivePayment(user : Principal) : Bool {
    switch (principalMap.get(userProfiles, user)) {
      case null false;
      case (?profile) {
        switch (profile.paymentStatus) {
          case (#active) true;
          case _ false;
        };
      };
    };
  };

  public shared ({ caller }) func initializeAccessControl() : async () {
    if (not firstUserInitialized) {
      AccessControl.initialize(accessControlState, caller);
      firstUserInitialized := true;
    };
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can register files");
    };
    Registry.add(registry, path, hash);
  };

  public query ({ caller }) func getFileReference(path : Text) : async Registry.FileReference {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can access files");
    };
    Registry.get(registry, path);
  };

  public query ({ caller }) func listFileReferences() : async [Registry.FileReference] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can list files");
    };
    Registry.list(registry);
  };

  public shared ({ caller }) func dropFileReference(path : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can drop files");
    };
    Registry.remove(registry, path);
  };

  public query ({ caller }) func getQuestions() : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can access questions");
    };

    if (AccessControl.isAdmin(accessControlState, caller)) {
      return Iter.toArray(textMap.vals(questions));
    };

    if (not hasActivePayment(caller)) {
      Debug.trap("Payment required: Please complete payment to access questions");
    };

    Iter.toArray(textMap.vals(questions));
  };

  public shared ({ caller }) func addQuestion(question : Question) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add questions");
    };
    questions := textMap.put(questions, question.id, question);
  };

  public shared ({ caller }) func updateQuestion(question : Question) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update questions");
    };
    questions := textMap.put(questions, question.id, question);
  };

  public shared ({ caller }) func deleteQuestion(questionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete questions");
    };
    questions := textMap.delete(questions, questionId);
  };

  public query ({ caller }) func getPaymentRecords() : async [PaymentRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view payment records");
    };
    Iter.toArray(textMap.vals(paymentRecords));
  };

  public shared ({ caller }) func addPaymentRecord(record : PaymentRecord) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add payment records");
    };
    paymentRecords := textMap.put(paymentRecords, record.id, record);
  };

  public shared ({ caller }) func updatePaymentRecord(record : PaymentRecord) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update payment records");
    };
    paymentRecords := textMap.put(paymentRecords, record.id, record);
  };

  public shared ({ caller }) func uploadPaymentProof(paymentRecordId : Text, filePath : Text, fileType : Text) : async () {
    let userRole = AccessControl.getUserRole(accessControlState, caller);

    switch (userRole) {
      case (#guest) {
        Debug.trap("Authentication required: Please log in to upload payment proof");
      };
      case (#admin) {
        Debug.trap("Unauthorized: Only students can upload payment proof");
      };
      case (#user) {
        switch (textMap.get(paymentRecords, paymentRecordId)) {
          case null {
            let newRecord : PaymentRecord = {
              id = paymentRecordId;
              user = caller;
              amount = 0;
              method = #stcBank;
              status = #pending;
              createdAt = Time.now();
              updatedAt = Time.now();
              proof = null;
            };
            paymentRecords := textMap.put(paymentRecords, paymentRecordId, newRecord);

            let proof : PaymentProof = {
              filePath;
              fileType;
              uploadedAt = Time.now();
            };

            let updatedRecord : PaymentRecord = {
              id = newRecord.id;
              user = newRecord.user;
              amount = newRecord.amount;
              method = newRecord.method;
              status = newRecord.status;
              createdAt = newRecord.createdAt;
              updatedAt = Time.now();
              proof = ?proof;
            };

            paymentRecords := textMap.put(paymentRecords, paymentRecordId, updatedRecord);
          };
          case (?record) {
            if (record.user != caller) {
              Debug.trap("Unauthorized: You can only upload payment proof for your own records");
            };

            let proof : PaymentProof = {
              filePath;
              fileType;
              uploadedAt = Time.now();
            };

            let updatedRecord : PaymentRecord = {
              id = record.id;
              user = record.user;
              amount = record.amount;
              method = record.method;
              status = record.status;
              createdAt = record.createdAt;
              updatedAt = Time.now();
              proof = ?proof;
            };

            paymentRecords := textMap.put(paymentRecords, paymentRecordId, updatedRecord);
          };
        };
      };
    };
  };

  public shared ({ caller }) func approvePayment(paymentRecordId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can approve payments");
    };

    switch (textMap.get(paymentRecords, paymentRecordId)) {
      case null Debug.trap("Payment record not found");
      case (?record) {
        let updatedRecord : PaymentRecord = {
          id = record.id;
          user = record.user;
          amount = record.amount;
          method = record.method;
          status = #active;
          createdAt = record.createdAt;
          updatedAt = Time.now();
          proof = record.proof;
        };
        paymentRecords := textMap.put(paymentRecords, record.id, updatedRecord);

        switch (principalMap.get(userProfiles, record.user)) {
          case null Debug.trap("User profile not found");
          case (?profile) {
            let updatedProfile : UserProfile = {
              name = profile.name;
              registrationTime = profile.registrationTime;
              paymentStatus = #active;
              paymentProof = profile.paymentProof;
            };
            userProfiles := principalMap.put(userProfiles, record.user, updatedProfile);
          };
        };
      };
    };
  };

  public query ({ caller }) func getComments() : async [Comment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view comments");
    };
    Iter.toArray(textMap.vals(comments));
  };

  public shared ({ caller }) func addComment(comment : Comment) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can add comments");
    };
    comments := textMap.put(comments, comment.id, comment);
  };

  public shared ({ caller }) func approveComment(commentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can approve comments");
    };
    switch (textMap.get(comments, commentId)) {
      case null Debug.trap("Comment not found");
      case (?comment) {
        let updatedComment = {
          id = comment.id;
          user = comment.user;
          questionId = comment.questionId;
          content = comment.content;
          approved = true;
          createdAt = comment.createdAt;
        };
        comments := textMap.put(comments, comment.id, updatedComment);
      };
    };
  };

  public shared ({ caller }) func deleteComment(commentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete comments");
    };
    comments := textMap.delete(comments, commentId);
  };

  public query func isStripeConfigured() : async Bool {
    return configuration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    configuration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (configuration) {
      case null Debug.trap("Stripe needs to be first configured");
      case (?value) value;
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can create checkout sessions");
    };

    let config = getStripeConfiguration();
    await Stripe.createCheckoutSession(config, caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func updatePaymentConfiguration(stcPayBarcodePath : ?Text, localBankDetails : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update payment configuration");
    };
    let newConfig : PaymentConfiguration = {
      stcPayBarcodePath;
      localBankDetails;
      updatedAt = Time.now();
    };
    paymentConfiguration := ?newConfig;
  };

  public query ({ caller }) func getPaymentConfiguration() : async ?PaymentConfiguration {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view payment configuration");
    };
    paymentConfiguration;
  };

  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can list users");
    };
    Iter.toArray(principalMap.entries(userProfiles));
  };

  public query ({ caller }) func getUserStats() : async UserStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view user stats");
    };

    let now = Time.now();
    let dayInNanos = 24 * 60 * 60 * 1_000_000_000;
    let weekInNanos = 7 * dayInNanos;
    let monthInNanos = 30 * dayInNanos;

    var totalUsers = 0;
    var newUsersLast24h = 0;
    var newUsersLast7d = 0;
    var newUsersLast30d = 0;

    for ((_, profile) in principalMap.entries(userProfiles)) {
      totalUsers += 1;
      let registrationTime = profile.registrationTime;
      if (now - registrationTime <= dayInNanos) {
        newUsersLast24h += 1;
      };
      if (now - registrationTime <= weekInNanos) {
        newUsersLast7d += 1;
      };
      if (now - registrationTime <= monthInNanos) {
        newUsersLast30d += 1;
      };
    };

    {
      totalUsers;
      newUsersLast24h;
      newUsersLast7d;
      newUsersLast30d;
    };
  };

  public query ({ caller }) func getUserActivities() : async [UserActivity] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view user activities");
    };
    Iter.toArray(principalMap.vals(userActivities));
  };

  public shared ({ caller }) func updateUserActivity(loginCount : Nat, questionAttempts : Nat, commentCount : Nat, lastLogin : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can update activity");
    };
    let activity : UserActivity = {
      user = caller;
      loginCount;
      questionAttempts;
      commentCount;
      lastLogin;
    };
    userActivities := principalMap.put(userActivities, caller, activity);
  };

  public shared ({ caller }) func initializeDomains() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can initialize domains");
    };

    let domains = [
      { id = "internal-medicine"; name = "Internal Medicine"; type_ = #domain; createdAt = Time.now(); updatedAt = Time.now() },
      { id = "surgery"; name = "Surgery"; type_ = #domain; createdAt = Time.now(); updatedAt = Time.now() },
      { id = "pediatrics"; name = "Pediatrics"; type_ = #domain; createdAt = Time.now(); updatedAt = Time.now() },
      { id = "obgyn"; name = "Obstetrics & Gynecology"; type_ = #domain; createdAt = Time.now(); updatedAt = Time.now() },
      { id = "ethics"; name = "Ethics"; type_ = #domain; createdAt = Time.now(); updatedAt = Time.now() },
    ];

    for (domain in domains.vals()) {
      domainTopics := textMap.put(domainTopics, domain.id, domain);
    };
  };

  public query ({ caller }) func getDomains() : async [DomainTopic] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view domains");
    };
    let allTopics = Iter.toArray(textMap.vals(domainTopics));
    let domains = List.filter<DomainTopic>(
      List.fromArray(allTopics),
      func(d) { d.type_ == #domain },
    );
    List.toArray(domains);
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public shared ({ caller }) func saveStudentProgress(progress : StudentProgress) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can save progress");
    };
    studentProgress := principalMap.put(studentProgress, caller, progress);
  };

  public query ({ caller }) func getStudentProgress() : async ?StudentProgress {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view progress");
    };
    principalMap.get(studentProgress, caller);
  };

  public shared ({ caller }) func addBookmark(questionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can add bookmarks");
    };
    let bookmark : Bookmark = {
      user = caller;
      questionId;
      createdAt = Time.now();
    };
    bookmarks := textMap.put(bookmarks, questionId, bookmark);
  };

  public shared ({ caller }) func removeBookmark(questionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can remove bookmarks");
    };
    bookmarks := textMap.delete(bookmarks, questionId);
  };

  public query ({ caller }) func getBookmarks() : async [Bookmark] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view bookmarks");
    };
    let userBookmarks = List.filter<Bookmark>(
      List.fromArray(Iter.toArray(textMap.vals(bookmarks))),
      func(b) { b.user == caller },
    );
    List.toArray(userBookmarks);
  };

  public query ({ caller }) func getQuestionsByMode(mode : StudyMode) : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can access questions");
    };

    if (not AccessControl.isAdmin(accessControlState, caller)) {
      if (not hasActivePayment(caller)) {
        Debug.trap("Payment required: Please complete payment to access questions");
      };
    };

    switch (mode) {
      case (#practice) {
        Iter.toArray(
          Iter.filter(
            textMap.vals(questions),
            func(q : Question) : Bool {
              q.state == #published;
            },
          )
        );
      };
      case (#timed) {
        Iter.toArray(
          Iter.filter(
            textMap.vals(questions),
            func(q : Question) : Bool {
              q.state == #published;
            },
          )
        );
      };
      case (#review) {
        Iter.toArray(
          Iter.filter(
            textMap.vals(questions),
            func(q : Question) : Bool {
              q.state == #published;
            },
          )
        );
      };
    };
  };

  public query ({ caller }) func getQuestionsByFilter(domain : ?Text, difficulty : ?Text) : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can access questions");
    };

    if (not AccessControl.isAdmin(accessControlState, caller)) {
      if (not hasActivePayment(caller)) {
        Debug.trap("Payment required: Please complete payment to access questions");
      };
    };

    Iter.toArray(
      Iter.filter(
        textMap.vals(questions),
        func(q : Question) : Bool {
          let domainMatch = switch (domain) {
            case null true;
            case (?d) q.domain == d;
          };
          let difficultyMatch = switch (difficulty) {
            case null true;
            case (?d) true;
          };
          domainMatch and difficultyMatch;
        },
      )
    );
  };

  public query ({ caller }) func searchQuestions(searchTerm : Text) : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can search questions");
    };

    if (not AccessControl.isAdmin(accessControlState, caller)) {
      if (not hasActivePayment(caller)) {
        Debug.trap("Payment required: Please complete payment to access questions");
      };
    };

    Iter.toArray(
      Iter.filter(
        textMap.vals(questions),
        func(q : Question) : Bool {
          Text.contains(q.content, #text searchTerm);
        },
      )
    );
  };

  public shared ({ caller }) func saveStudyStatistics(stats : StudyStatistics) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can save statistics");
    };
    studyStatistics := principalMap.put(studyStatistics, caller, stats);
  };

  public query ({ caller }) func getStudyStatistics() : async ?StudyStatistics {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view statistics");
    };
    principalMap.get(studyStatistics, caller);
  };

  public shared ({ caller }) func updateBrandAssets(logoPath : ?Text, soundPath : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update brand assets");
    };
    let newAssets : BrandAssets = {
      logoPath;
      soundPath;
      updatedAt = Time.now();
    };
    brandAssets := ?newAssets;
  };

  public query func getBrandAssets() : async ?BrandAssets {
    brandAssets;
  };

  public shared ({ caller }) func saveCsvPreview(previewId : Text, preview : CsvPreview) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can save CSV previews");
    };
    csvPreviews := textMap.put(csvPreviews, previewId, preview);
  };

  public query ({ caller }) func getCsvPreview(previewId : Text) : async CsvPreview {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can get CSV previews");
    };

    switch (textMap.get(csvPreviews, previewId)) {
      case null Debug.trap("CSV preview not found or has expired. Please re-upload the file and try again.");
      case (?preview) preview;
    };
  };

  public shared ({ caller }) func deleteCsvPreview(previewId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete CSV previews");
    };
    csvPreviews := textMap.delete(csvPreviews, previewId);
  };

  public shared ({ caller }) func processCsvPreview(previewId : Text) : async CsvImportResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can process CSV previews");
    };

    switch (textMap.get(csvPreviews, previewId)) {
      case null Debug.trap("CSV preview not found or has expired. Please re-upload the file and try again.");
      case (?preview) {
        var importedCount = 0;
        var errors = List.nil<Text>();

        var rowIndex = 0;
        for (row in preview.rows.vals()) {
          if (rowIndex > 0) {
            if (row.size() >= 8) {
              let question : Question = {
                id = row[0];
                content = row[1];
                options = Iter.toArray(Text.split(row[2], #char '|'));
                correctAnswers = [0];
                explanation = row[4];
                questionType = #singleChoice;
                domain = row[6];
                state = #published;
                version = 1;
                createdAt = Time.now();
                updatedAt = Time.now();
              };
              questions := textMap.put(questions, question.id, question);
              importedCount += 1;
            } else {
              errors := List.push("Invalid format on row " # Nat.toText(rowIndex + 1), errors);
            };
          };
          rowIndex += 1;
        };

        {
          success = errors == List.nil();
          message = "CSV preview processed";
          importedCount;
          errors = List.toArray(errors);
        };
      };
    };
  };

  public shared ({ caller }) func cancelCsvPreview(previewId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can cancel CSV previews");
    };
    csvPreviews := textMap.delete(csvPreviews, previewId);
  };

  public shared ({ caller }) func addDomainTopic(id : Text, name : Text, type_ : DomainTopicType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add domains/topics");
    };
    let domainTopic : DomainTopic = {
      id;
      name;
      type_;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    domainTopics := textMap.put(domainTopics, id, domainTopic);
  };

  public shared ({ caller }) func updateDomainTopic(id : Text, newName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update domains/topics");
    };
    switch (textMap.get(domainTopics, id)) {
      case null Debug.trap("Domain/Topic not found");
      case (?domainTopic) {
        let updatedDomainTopic = {
          id = domainTopic.id;
          name = newName;
          type_ = domainTopic.type_;
          createdAt = domainTopic.createdAt;
          updatedAt = Time.now();
        };
        domainTopics := textMap.put(domainTopics, id, updatedDomainTopic);

        let updatedQuestions = textMap.map<Question, Question>(
          questions,
          func(_id, question) {
            switch (domainTopic.type_) {
              case (#domain) {
                if (question.domain == domainTopic.name) {
                  { question with domain = newName };
                } else {
                  question;
                };
              };
              case (#topic) {
                question;
              };
            };
          },
        );
        questions := updatedQuestions;
      };
    };
  };

  public shared ({ caller }) func deleteDomainTopic(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete domains/topics");
    };
    switch (textMap.get(domainTopics, id)) {
      case null Debug.trap("Domain/Topic not found");
      case (?domainTopic) {
        domainTopics := textMap.delete(domainTopics, id);

        let updatedQuestions = textMap.map<Question, Question>(
          questions,
          func(_id, question) {
            switch (domainTopic.type_) {
              case (#domain) {
                if (question.domain == domainTopic.name) {
                  { question with domain = "Uncategorized" };
                } else {
                  question;
                };
              };
              case (#topic) {
                question;
              };
            };
          },
        );
        questions := updatedQuestions;
      };
    };
  };

  public query ({ caller }) func getDomainTopics() : async [DomainTopic] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view domain topics");
    };
    Iter.toArray(textMap.vals(domainTopics));
  };

  public query ({ caller }) func getAllDomainsAndTopics() : async [DomainTopic] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view domains and topics");
    };
    Iter.toArray(textMap.vals(domainTopics));
  };

  public query ({ caller }) func getAllQuestions() : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view all questions");
    };
    Iter.toArray(textMap.vals(questions));
  };

  public shared ({ caller }) func updateCsvPreviewDelimiter(previewId : Text, newDelimiter : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update CSV preview delimiter");
    };

    switch (textMap.get(csvPreviews, previewId)) {
      case null Debug.trap("CSV preview not found or has expired. Please re-upload the file and try again.");
      case (?preview) {
        let updatedPreview = {
          headers = preview.headers;
          rows = preview.rows;
          validationResults = preview.validationResults;
          delimiter = newDelimiter;
          importMode = preview.importMode;
        };
        csvPreviews := textMap.put(csvPreviews, previewId, updatedPreview);
      };
    };
  };

  public query ({ caller }) func getCsvPreviewDelimiter(previewId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can get CSV preview delimiter");
    };

    switch (textMap.get(csvPreviews, previewId)) {
      case null Debug.trap("CSV preview not found or has expired. Please re-upload the file and try again.");
      case (?preview) preview.delimiter;
    };
  };

  public shared ({ caller }) func validateCsvPreviewDelimiter(previewId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can validate CSV preview delimiter");
    };

    switch (textMap.get(csvPreviews, previewId)) {
      case null Debug.trap("CSV preview not found or has expired. Please re-upload the file and try again.");
      case (?preview) {
        let delimiter = preview.delimiter;
        delimiter == "," or delimiter == ";" or delimiter == "\t";
      };
    };
  };

  public shared ({ caller }) func updateCsvPreviewRows(previewId : Text, newRows : [[Text]]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update CSV preview rows");
    };

    switch (textMap.get(csvPreviews, previewId)) {
      case null Debug.trap("CSV preview not found or has expired. Please re-upload the file and try again.");
      case (?preview) {
        let updatedPreview = {
          headers = preview.headers;
          rows = newRows;
          validationResults = preview.validationResults;
          delimiter = preview.delimiter;
          importMode = preview.importMode;
        };
        csvPreviews := textMap.put(csvPreviews, previewId, updatedPreview);
      };
    };
  };

  public query ({ caller }) func getCsvPreviewRows(previewId : Text) : async [[Text]] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can get CSV preview rows");
    };

    switch (textMap.get(csvPreviews, previewId)) {
      case null Debug.trap("CSV preview not found or has expired. Please re-upload the file and try again.");
      case (?preview) preview.rows;
    };
  };

  public shared ({ caller }) func updateCsvPreviewHeaders(previewId : Text, newHeaders : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update CSV preview headers");
    };

    switch (textMap.get(csvPreviews, previewId)) {
      case null Debug.trap("CSV preview not found or has expired. Please re-upload the file and try again.");
      case (?preview) {
        let updatedPreview = {
          headers = newHeaders;
          rows = preview.rows;
          validationResults = preview.validationResults;
          delimiter = preview.delimiter;
          importMode = preview.importMode;
        };
        csvPreviews := textMap.put(csvPreviews, previewId, updatedPreview);
      };
    };
  };

  public query ({ caller }) func getCsvPreviewHeaders(previewId : Text) : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can get CSV preview headers");
    };

    switch (textMap.get(csvPreviews, previewId)) {
      case null Debug.trap("CSV preview not found or has expired. Please re-upload the file and try again.");
      case (?preview) preview.headers;
    };
  };

  public shared ({ caller }) func updateCsvPreviewValidationResults(previewId : Text, newValidationResults : [ValidationResult]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update CSV preview validation results");
    };

    switch (textMap.get(csvPreviews, previewId)) {
      case null Debug.trap("CSV preview not found or has expired. Please re-upload the file and try again.");
      case (?preview) {
        let updatedPreview = {
          headers = preview.headers;
          rows = preview.rows;
          validationResults = newValidationResults;
          delimiter = preview.delimiter;
          importMode = preview.importMode;
        };
        csvPreviews := textMap.put(csvPreviews, previewId, updatedPreview);
      };
    };
  };

  public query ({ caller }) func getCsvPreviewValidationResults(previewId : Text) : async [ValidationResult] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can get CSV preview validation results");
    };

    switch (textMap.get(csvPreviews, previewId)) {
      case null Debug.trap("CSV preview not found or has expired. Please re-upload the file and try again.");
      case (?preview) preview.validationResults;
    };
  };

  public shared ({ caller }) func updateCsvPreviewImportMode(previewId : Text, newImportMode : ?ImportMode) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update CSV preview import mode");
    };

    switch (textMap.get(csvPreviews, previewId)) {
      case null Debug.trap("CSV preview not found or has expired. Please re-upload the file and try again.");
      case (?preview) {
        let updatedPreview = {
          headers = preview.headers;
          rows = preview.rows;
          validationResults = preview.validationResults;
          delimiter = preview.delimiter;
          importMode = newImportMode;
        };
        csvPreviews := textMap.put(csvPreviews, previewId, updatedPreview);
      };
    };
  };

  public shared ({ caller }) func setAiAssistantConfig(apiKey : Text, enabled : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can set AI assistant config");
    };
    let config : AiAssistantConfig = {
      apiKey;
      enabled;
      lastUpdated = Time.now();
    };
    aiAssistantConfig := ?config;
  };

  public query ({ caller }) func getAiAssistantConfig() : async ?AiAssistantConfig {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view AI assistant config");
    };
    aiAssistantConfig;
  };

  public query ({ caller }) func isAiAssistantEnabled() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can check AI assistant status");
    };

    if (not AccessControl.isAdmin(accessControlState, caller)) {
      if (not hasActivePayment(caller)) {
        Debug.trap("Payment required: Please complete payment to access AI assistant");
      };
    };

    switch (aiAssistantConfig) {
      case null false;
      case (?config) config.enabled;
    };
  };

  public shared ({ caller }) func deleteAiAssistantConfig() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete AI assistant config");
    };
    aiAssistantConfig := null;
  };

  public query ({ caller }) func getAllDomains() : async [DomainTopic] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can get all domains");
    };
    let allTopics = Iter.toArray(textMap.vals(domainTopics));
    let domains = List.filter<DomainTopic>(
      List.fromArray(allTopics),
      func(d) { d.type_ == #domain },
    );
    List.toArray(domains);
  };

  public query ({ caller }) func getQuestionsWithDomains() : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can get questions with domains");
    };
    let allQuestions = Iter.toArray(textMap.vals(questions));
    let questionsWithDomains = List.filter<Question>(
      List.fromArray(allQuestions),
      func(q) { q.domain != "" },
    );
    List.toArray(questionsWithDomains);
  };

  public query ({ caller }) func getOrphanQuestions() : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can get orphan questions");
    };
    let allQuestions = Iter.toArray(textMap.vals(questions));
    let orphanQuestions = List.filter<Question>(
      List.fromArray(allQuestions),
      func(q) {
        switch (findDomainByName(q.domain)) {
          case null true;
          case (?_) false;
        };
      },
    );
    List.toArray(orphanQuestions);
  };

  func findDomainByName(name : Text) : ?DomainTopic {
    let allTopics = Iter.toArray(textMap.vals(domainTopics));
    let domains = List.filter<DomainTopic>(
      List.fromArray(allTopics),
      func(d) { d.type_ == #domain },
    );
    List.find<DomainTopic>(List.fromArray(List.toArray(domains)), func(d) { d.name == name });
  };

  private func getDeepSeekApiKeyInternal() : Text {
    switch (aiAssistantConfig) {
      case null Debug.trap("AI assistant config not found");
      case (?config) config.apiKey;
    };
  };

  public shared ({ caller }) func deepSeekChat(request : AiChatRequest) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can use AI assistant");
    };

    if (not AccessControl.isAdmin(accessControlState, caller)) {
      if (not hasActivePayment(caller)) {
        Debug.trap("Payment required: Please complete payment to access AI assistant");
      };
    };

    switch (aiAssistantConfig) {
      case null Debug.trap("AI assistant is not configured");
      case (?config) {
        if (not config.enabled) {
          Debug.trap("AI assistant is currently disabled");
        };
      };
    };

    let apiKey = getDeepSeekApiKeyInternal();
    let url = "https://api.deepseek.com/v1/chat";
    let headers = [
      { name = "Content-Type"; value = "application/json" },
      { name = "Authorization"; value = "Bearer " # apiKey },
    ];
    let body = "{ \"model\": \"deepseek-chat\", \"messages\": " # encodeMessages(request.messages) # " }";

    let responseText = await OutCall.httpPostRequest(url, headers, body, transform);

    if (Text.contains(responseText, #text "\"choices\": [") and Text.contains(responseText, #text "\"message\"") and Text.contains(responseText, #text "\"content\": \"")) {
      let choicesPart = Text.split(responseText, #text "\"choices\": [");
      switch (Iter.toArray(choicesPart).size()) {
        case 0 { return "The AI could not process your request. Please try again." };
        case _ {
          let choicesContent = Iter.toArray(choicesPart)[0];
          let messagePart = Text.split(choicesContent, #text "\"message\"");
          switch (Iter.toArray(messagePart).size()) {
            case 0 { return "The AI could not process your request. Please try again." };
            case _ {
              let contentPart = Text.split(choicesContent, #text "\"content\": \"");
              switch (Iter.toArray(contentPart).size()) {
                case 0 { return "The AI could not process your request. Please try again." };
                case _ {
                  let contentText = Iter.toArray(contentPart)[0];
                  let endQuote = Text.split(contentText, #char '\"');
                  switch (Iter.toArray(endQuote).size()) {
                    case 0 { return "The AI could not process your request. Please try again." };
                    case _ { return Iter.toArray(endQuote)[0] };
                  };
                };
              };
            };
          };
        };
      };
    } else {
      "The AI could not process your request. Please try again.";
    };
  };

  func encodeMessages(messages : [AiChatMessage]) : Text {
    let encoded = Text.join(
      ", ",
      Iter.map(
        Iter.fromArray(messages),
        func(m : AiChatMessage) : Text {
          "{ \"role\": \"" # m.role # "\", \"content\": \"" # m.content # "\" }";
        },
      ),
    );
    "[ " # encoded # " ]";
  };
};

