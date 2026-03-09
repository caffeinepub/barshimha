export const idlFactory = ({ IDL }) => {
  const __CAFFEINE_STORAGE_RefillInformation = IDL.Record({
    'proposed_top_up_amount' : IDL.Opt(IDL.Nat),
  });
  const __CAFFEINE_STORAGE_RefillResult = IDL.Record({
    'success' : IDL.Opt(IDL.Bool),
    'topped_up_amount' : IDL.Opt(IDL.Nat),
  });
  const Comment = IDL.Record({
    'id' : IDL.Text,
    'content' : IDL.Text,
    'createdAt' : IDL.Int,
    'user' : IDL.Principal,
    'approved' : IDL.Bool,
    'questionId' : IDL.Text,
  });
  const DomainTopicType = IDL.Variant({
    'topic' : IDL.Null,
    'domain' : IDL.Null,
  });
  const PaymentStatus = IDL.Variant({
    'active' : IDL.Null,
    'expired' : IDL.Null,
    'pending' : IDL.Null,
  });
  const PaymentMethod = IDL.Variant({
    'localBank' : IDL.Null,
    'stcBank' : IDL.Null,
  });
  const PaymentProof = IDL.Record({
    'filePath' : IDL.Text,
    'fileType' : IDL.Text,
    'uploadedAt' : IDL.Int,
  });
  const PaymentRecord = IDL.Record({
    'id' : IDL.Text,
    'status' : PaymentStatus,
    'method' : PaymentMethod,
    'createdAt' : IDL.Int,
    'user' : IDL.Principal,
    'updatedAt' : IDL.Int,
    'proof' : IDL.Opt(PaymentProof),
    'amount' : IDL.Nat,
  });
  const QuestionType = IDL.Variant({
    'multiSelect' : IDL.Null,
    'singleChoice' : IDL.Null,
    'numeric' : IDL.Null,
    'trueFalse' : IDL.Null,
  });
  const QuestionState = IDL.Variant({
    'published' : IDL.Null,
    'draft' : IDL.Null,
    'archived' : IDL.Null,
  });
  const Question = IDL.Record({
    'id' : IDL.Text,
    'content' : IDL.Text,
    'domain' : IDL.Text,
    'explanation' : IDL.Text,
    'createdAt' : IDL.Int,
    'questionType' : QuestionType,
    'version' : IDL.Nat,
    'updatedAt' : IDL.Int,
    'state' : QuestionState,
    'correctAnswers' : IDL.Vec(IDL.Nat),
    'options' : IDL.Vec(IDL.Text),
  });
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const ShoppingItem = IDL.Record({
    'productName' : IDL.Text,
    'currency' : IDL.Text,
    'quantity' : IDL.Nat,
    'priceInCents' : IDL.Nat,
    'productDescription' : IDL.Text,
  });
  const DomainTopic = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'createdAt' : IDL.Int,
    'type' : DomainTopicType,
    'updatedAt' : IDL.Int,
  });
  const UserProfile = IDL.Record({
    'paymentStatus' : PaymentStatus,
    'name' : IDL.Text,
    'paymentProof' : IDL.Opt(PaymentProof),
    'registrationTime' : IDL.Int,
  });
  const Bookmark = IDL.Record({
    'createdAt' : IDL.Int,
    'user' : IDL.Principal,
    'questionId' : IDL.Text,
  });
  const BrandAssets = IDL.Record({
    'soundPath' : IDL.Opt(IDL.Text),
    'logoPath' : IDL.Opt(IDL.Text),
    'updatedAt' : IDL.Int,
  });
  const ValidationResult = IDL.Record({
    'errors' : IDL.Vec(IDL.Text),
    'rowIndex' : IDL.Nat,
    'isValid' : IDL.Bool,
  });
  const CsvPreview = IDL.Record({
    'validationResults' : IDL.Vec(ValidationResult),
    'rows' : IDL.Vec(IDL.Vec(IDL.Text)),
    'headers' : IDL.Vec(IDL.Text),
    'delimiter' : IDL.Text,
  });
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  const PaymentConfiguration = IDL.Record({
    'localBankDetails' : IDL.Opt(IDL.Text),
    'updatedAt' : IDL.Int,
    'stcPayBarcodePath' : IDL.Opt(IDL.Text),
  });
  const StudyMode = IDL.Variant({
    'review' : IDL.Null,
    'timed' : IDL.Null,
    'practice' : IDL.Null,
  });
  const StripeSessionStatus = IDL.Variant({
    'completed' : IDL.Record({
      'userPrincipal' : IDL.Opt(IDL.Text),
      'response' : IDL.Text,
    }),
    'failed' : IDL.Record({ 'error' : IDL.Text }),
  });
  const StudentProgress = IDL.Record({
    'streak' : IDL.Nat,
    'badges' : IDL.Vec(IDL.Text),
    'totalAttempts' : IDL.Nat,
    'completedQuestions' : IDL.Nat,
    'correctAnswers' : IDL.Nat,
    'weakAreas' : IDL.Vec(IDL.Text),
    'accuracy' : IDL.Float64,
  });
  const AggregateStats = IDL.Record({
    'totalTimeSpent' : IDL.Int,
    'totalQuestionsAttempted' : IDL.Nat,
    'totalQuestionsCorrect' : IDL.Nat,
    'totalSessionsCompleted' : IDL.Nat,
    'overallAccuracy' : IDL.Float64,
  });
  const ModeStats = IDL.Record({
    'accuracyPercentage' : IDL.Float64,
    'timeSpent' : IDL.Int,
    'questionsAttempted' : IDL.Nat,
    'sessionsCompleted' : IDL.Nat,
    'questionsCorrect' : IDL.Nat,
  });
  const StudyStatistics = IDL.Record({
    'aggregateStats' : AggregateStats,
    'reviewModeStats' : ModeStats,
    'timedModeStats' : ModeStats,
    'practiceModeStats' : ModeStats,
  });
  const UserActivity = IDL.Record({
    'user' : IDL.Principal,
    'loginCount' : IDL.Nat,
    'commentCount' : IDL.Nat,
    'lastLogin' : IDL.Int,
    'questionAttempts' : IDL.Nat,
  });
  const UserStats = IDL.Record({
    'newUsersLast24h' : IDL.Nat,
    'newUsersLast30d' : IDL.Nat,
    'totalUsers' : IDL.Nat,
    'newUsersLast7d' : IDL.Nat,
  });
  const ApprovalStatus = IDL.Variant({
    'pending' : IDL.Null,
    'approved' : IDL.Null,
    'rejected' : IDL.Null,
  });
  const UserApprovalInfo = IDL.Record({
    'status' : ApprovalStatus,
    'principal' : IDL.Principal,
  });
  const CsvImportResult = IDL.Record({
    'errors' : IDL.Vec(IDL.Text),
    'importedCount' : IDL.Nat,
    'message' : IDL.Text,
    'success' : IDL.Bool,
  });
  const StripeConfiguration = IDL.Record({
    'allowedCountries' : IDL.Vec(IDL.Text),
    'secretKey' : IDL.Text,
  });
  const http_header = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const http_request_result = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  const TransformationInput = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : http_request_result,
  });
  const TransformationOutput = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  return IDL.Service({
    '__CAFFEINE_STORAGE_blobsRemoved' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Nat],
        [],
      ),
    '__CAFFEINE_STORAGE_blobsToRemove' : IDL.Func([], [IDL.Vec(IDL.Text)], []),
    '__CAFFEINE_STORAGE_refillCashier' : IDL.Func(
        [IDL.Opt(__CAFFEINE_STORAGE_RefillInformation)],
        [__CAFFEINE_STORAGE_RefillResult],
        [],
      ),
    '__CAFFEINE_STORAGE_updateGatewayPrincipals' : IDL.Func([], [], []),
    'addBookmark' : IDL.Func([IDL.Text], [], []),
    'addComment' : IDL.Func([Comment], [], []),
    'addDomainTopic' : IDL.Func([IDL.Text, IDL.Text, DomainTopicType], [], []),
    'addPaymentRecord' : IDL.Func([PaymentRecord], [], []),
    'addQuestion' : IDL.Func([Question], [], []),
    'approveComment' : IDL.Func([IDL.Text], [], []),
    'approvePayment' : IDL.Func([IDL.Text], [], []),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'cancelCsvPreview' : IDL.Func([IDL.Text], [], []),
    'createCheckoutSession' : IDL.Func(
        [IDL.Vec(ShoppingItem), IDL.Text, IDL.Text],
        [IDL.Text],
        [],
      ),
    'deleteComment' : IDL.Func([IDL.Text], [], []),
    'deleteCsvPreview' : IDL.Func([IDL.Text], [], []),
    'deleteDomainTopic' : IDL.Func([IDL.Text], [], []),
    'deleteQuestion' : IDL.Func([IDL.Text], [], []),
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'getAllDomainsAndTopics' : IDL.Func([], [IDL.Vec(DomainTopic)], ['query']),
    'getAllQuestions' : IDL.Func([], [IDL.Vec(Question)], ['query']),
    'getAllUsers' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, UserProfile))],
        ['query'],
      ),
    'getBookmarks' : IDL.Func([], [IDL.Vec(Bookmark)], ['query']),
    'getBrandAssets' : IDL.Func([], [IDL.Opt(BrandAssets)], ['query']),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getComments' : IDL.Func([], [IDL.Vec(Comment)], ['query']),
    'getCsvPreview' : IDL.Func([IDL.Text], [CsvPreview], ['query']),
    'getCsvPreviewDelimiter' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'getCsvPreviewHeaders' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(IDL.Text)],
        ['query'],
      ),
    'getCsvPreviewRows' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(IDL.Vec(IDL.Text))],
        ['query'],
      ),
    'getCsvPreviewValidationResults' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(ValidationResult)],
        ['query'],
      ),
    'getDomainTopics' : IDL.Func([], [IDL.Vec(DomainTopic)], ['query']),
    'getDomains' : IDL.Func([], [IDL.Vec(DomainTopic)], ['query']),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], ['query']),
    'getPaymentConfiguration' : IDL.Func(
        [],
        [IDL.Opt(PaymentConfiguration)],
        ['query'],
      ),
    'getPaymentRecords' : IDL.Func([], [IDL.Vec(PaymentRecord)], ['query']),
    'getQuestions' : IDL.Func([], [IDL.Vec(Question)], ['query']),
    'getQuestionsByFilter' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [IDL.Vec(Question)],
        ['query'],
      ),
    'getQuestionsByMode' : IDL.Func(
        [StudyMode],
        [IDL.Vec(Question)],
        ['query'],
      ),
    'getStripeSessionStatus' : IDL.Func([IDL.Text], [StripeSessionStatus], []),
    'getStudentProgress' : IDL.Func([], [IDL.Opt(StudentProgress)], ['query']),
    'getStudyStatistics' : IDL.Func([], [IDL.Opt(StudyStatistics)], ['query']),
    'getUserActivities' : IDL.Func([], [IDL.Vec(UserActivity)], ['query']),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'getUserStats' : IDL.Func([], [UserStats], ['query']),
    'initializeAccessControl' : IDL.Func([], [], []),
    'initializeDomains' : IDL.Func([], [], []),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'isCallerApproved' : IDL.Func([], [IDL.Bool], ['query']),
    'isStripeConfigured' : IDL.Func([], [IDL.Bool], ['query']),
    'listApprovals' : IDL.Func([], [IDL.Vec(UserApprovalInfo)], ['query']),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], ['query']),
    'processCsvPreview' : IDL.Func([IDL.Text], [CsvImportResult], []),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'removeBookmark' : IDL.Func([IDL.Text], [], []),
    'requestApproval' : IDL.Func([], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'saveCsvPreview' : IDL.Func([IDL.Text, CsvPreview], [], []),
    'saveStudentProgress' : IDL.Func([StudentProgress], [], []),
    'saveStudyStatistics' : IDL.Func([StudyStatistics], [], []),
    'searchQuestions' : IDL.Func([IDL.Text], [IDL.Vec(Question)], ['query']),
    'setApproval' : IDL.Func([IDL.Principal, ApprovalStatus], [], []),
    'setStripeConfiguration' : IDL.Func([StripeConfiguration], [], []),
    'transform' : IDL.Func(
        [TransformationInput],
        [TransformationOutput],
        ['query'],
      ),
    'updateBrandAssets' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [],
        [],
      ),
    'updateCsvPreviewDelimiter' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'updateCsvPreviewHeaders' : IDL.Func([IDL.Text, IDL.Vec(IDL.Text)], [], []),
    'updateCsvPreviewRows' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Vec(IDL.Text))],
        [],
        [],
      ),
    'updateCsvPreviewValidationResults' : IDL.Func(
        [IDL.Text, IDL.Vec(ValidationResult)],
        [],
        [],
      ),
    'updateDomainTopic' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'updatePaymentConfiguration' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [],
        [],
      ),
    'updatePaymentRecord' : IDL.Func([PaymentRecord], [], []),
    'updateQuestion' : IDL.Func([Question], [], []),
    'updateUserActivity' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Nat, IDL.Int],
        [],
        [],
      ),
    'uploadPaymentProof' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [], []),
    'validateCsvPreviewDelimiter' : IDL.Func([IDL.Text], [IDL.Bool], []),
  });
};
export const init = ({ IDL }) => { return []; };
