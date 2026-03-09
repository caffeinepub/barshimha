import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AggregateStats {
  'totalTimeSpent' : bigint,
  'totalQuestionsAttempted' : bigint,
  'totalQuestionsCorrect' : bigint,
  'totalSessionsCompleted' : bigint,
  'overallAccuracy' : number,
}
export type ApprovalStatus = { 'pending' : null } |
  { 'approved' : null } |
  { 'rejected' : null };
export interface Bookmark {
  'createdAt' : bigint,
  'user' : Principal,
  'questionId' : string,
}
export interface BrandAssets {
  'soundPath' : [] | [string],
  'logoPath' : [] | [string],
  'updatedAt' : bigint,
}
export interface Comment {
  'id' : string,
  'content' : string,
  'createdAt' : bigint,
  'user' : Principal,
  'approved' : boolean,
  'questionId' : string,
}
export interface CsvImportResult {
  'errors' : Array<string>,
  'importedCount' : bigint,
  'message' : string,
  'success' : boolean,
}
export interface CsvPreview {
  'validationResults' : Array<ValidationResult>,
  'rows' : Array<Array<string>>,
  'headers' : Array<string>,
  'delimiter' : string,
}
export interface DomainTopic {
  'id' : string,
  'name' : string,
  'createdAt' : bigint,
  'type' : DomainTopicType,
  'updatedAt' : bigint,
}
export type DomainTopicType = { 'topic' : null } |
  { 'domain' : null };
export interface FileReference { 'hash' : string, 'path' : string }
export interface ModeStats {
  'accuracyPercentage' : number,
  'timeSpent' : bigint,
  'questionsAttempted' : bigint,
  'sessionsCompleted' : bigint,
  'questionsCorrect' : bigint,
}
export interface PaymentConfiguration {
  'localBankDetails' : [] | [string],
  'updatedAt' : bigint,
  'stcPayBarcodePath' : [] | [string],
}
export type PaymentMethod = { 'localBank' : null } |
  { 'stcBank' : null };
export interface PaymentProof {
  'filePath' : string,
  'fileType' : string,
  'uploadedAt' : bigint,
}
export interface PaymentRecord {
  'id' : string,
  'status' : PaymentStatus,
  'method' : PaymentMethod,
  'createdAt' : bigint,
  'user' : Principal,
  'updatedAt' : bigint,
  'proof' : [] | [PaymentProof],
  'amount' : bigint,
}
export type PaymentStatus = { 'active' : null } |
  { 'expired' : null } |
  { 'pending' : null };
export interface Question {
  'id' : string,
  'content' : string,
  'domain' : string,
  'explanation' : string,
  'createdAt' : bigint,
  'questionType' : QuestionType,
  'version' : bigint,
  'updatedAt' : bigint,
  'state' : QuestionState,
  'correctAnswers' : Array<bigint>,
  'options' : Array<string>,
}
export type QuestionState = { 'published' : null } |
  { 'draft' : null } |
  { 'archived' : null };
export type QuestionType = { 'multiSelect' : null } |
  { 'singleChoice' : null } |
  { 'numeric' : null } |
  { 'trueFalse' : null };
export interface ShoppingItem {
  'productName' : string,
  'currency' : string,
  'quantity' : bigint,
  'priceInCents' : bigint,
  'productDescription' : string,
}
export interface StripeConfiguration {
  'allowedCountries' : Array<string>,
  'secretKey' : string,
}
export type StripeSessionStatus = {
    'completed' : { 'userPrincipal' : [] | [string], 'response' : string }
  } |
  { 'failed' : { 'error' : string } };
export interface StudentProgress {
  'streak' : bigint,
  'badges' : Array<string>,
  'totalAttempts' : bigint,
  'completedQuestions' : bigint,
  'correctAnswers' : bigint,
  'weakAreas' : Array<string>,
  'accuracy' : number,
}
export type StudyMode = { 'review' : null } |
  { 'timed' : null } |
  { 'practice' : null };
export interface StudyStatistics {
  'aggregateStats' : AggregateStats,
  'reviewModeStats' : ModeStats,
  'timedModeStats' : ModeStats,
  'practiceModeStats' : ModeStats,
}
export interface TransformationInput {
  'context' : Uint8Array | number[],
  'response' : http_request_result,
}
export interface TransformationOutput {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<http_header>,
}
export interface UserActivity {
  'user' : Principal,
  'loginCount' : bigint,
  'commentCount' : bigint,
  'lastLogin' : bigint,
  'questionAttempts' : bigint,
}
export interface UserApprovalInfo {
  'status' : ApprovalStatus,
  'principal' : Principal,
}
export interface UserProfile {
  'paymentStatus' : PaymentStatus,
  'name' : string,
  'paymentProof' : [] | [PaymentProof],
  'registrationTime' : bigint,
}
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface UserStats {
  'newUsersLast24h' : bigint,
  'newUsersLast30d' : bigint,
  'totalUsers' : bigint,
  'newUsersLast7d' : bigint,
}
export interface ValidationResult {
  'errors' : Array<string>,
  'rowIndex' : bigint,
  'isValid' : boolean,
}
export interface __CAFFEINE_STORAGE_RefillInformation {
  'proposed_top_up_amount' : [] | [bigint],
}
export interface __CAFFEINE_STORAGE_RefillResult {
  'success' : [] | [boolean],
  'topped_up_amount' : [] | [bigint],
}
export interface http_header { 'value' : string, 'name' : string }
export interface http_request_result {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<http_header>,
}
export interface _SERVICE {
  '__CAFFEINE_STORAGE_blobsRemoved' : ActorMethod<[Array<string>], bigint>,
  '__CAFFEINE_STORAGE_blobsToRemove' : ActorMethod<[], Array<string>>,
  '__CAFFEINE_STORAGE_refillCashier' : ActorMethod<
    [[] | [__CAFFEINE_STORAGE_RefillInformation]],
    __CAFFEINE_STORAGE_RefillResult
  >,
  '__CAFFEINE_STORAGE_updateGatewayPrincipals' : ActorMethod<[], undefined>,
  'addBookmark' : ActorMethod<[string], undefined>,
  'addComment' : ActorMethod<[Comment], undefined>,
  'addDomainTopic' : ActorMethod<[string, string, DomainTopicType], undefined>,
  'addPaymentRecord' : ActorMethod<[PaymentRecord], undefined>,
  'addQuestion' : ActorMethod<[Question], undefined>,
  'approveComment' : ActorMethod<[string], undefined>,
  'approvePayment' : ActorMethod<[string], undefined>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'cancelCsvPreview' : ActorMethod<[string], undefined>,
  'createCheckoutSession' : ActorMethod<
    [Array<ShoppingItem>, string, string],
    string
  >,
  'deleteComment' : ActorMethod<[string], undefined>,
  'deleteCsvPreview' : ActorMethod<[string], undefined>,
  'deleteDomainTopic' : ActorMethod<[string], undefined>,
  'deleteQuestion' : ActorMethod<[string], undefined>,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'getAllDomainsAndTopics' : ActorMethod<[], Array<DomainTopic>>,
  'getAllQuestions' : ActorMethod<[], Array<Question>>,
  'getAllUsers' : ActorMethod<[], Array<[Principal, UserProfile]>>,
  'getBookmarks' : ActorMethod<[], Array<Bookmark>>,
  'getBrandAssets' : ActorMethod<[], [] | [BrandAssets]>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getComments' : ActorMethod<[], Array<Comment>>,
  'getCsvPreview' : ActorMethod<[string], CsvPreview>,
  'getCsvPreviewDelimiter' : ActorMethod<[string], string>,
  'getCsvPreviewHeaders' : ActorMethod<[string], Array<string>>,
  'getCsvPreviewRows' : ActorMethod<[string], Array<Array<string>>>,
  'getCsvPreviewValidationResults' : ActorMethod<
    [string],
    Array<ValidationResult>
  >,
  'getDomainTopics' : ActorMethod<[], Array<DomainTopic>>,
  'getDomains' : ActorMethod<[], Array<DomainTopic>>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getPaymentConfiguration' : ActorMethod<[], [] | [PaymentConfiguration]>,
  'getPaymentRecords' : ActorMethod<[], Array<PaymentRecord>>,
  'getQuestions' : ActorMethod<[], Array<Question>>,
  'getQuestionsByFilter' : ActorMethod<
    [[] | [string], [] | [string]],
    Array<Question>
  >,
  'getQuestionsByMode' : ActorMethod<[StudyMode], Array<Question>>,
  'getStripeSessionStatus' : ActorMethod<[string], StripeSessionStatus>,
  'getStudentProgress' : ActorMethod<[], [] | [StudentProgress]>,
  'getStudyStatistics' : ActorMethod<[], [] | [StudyStatistics]>,
  'getUserActivities' : ActorMethod<[], Array<UserActivity>>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'getUserStats' : ActorMethod<[], UserStats>,
  'initializeAccessControl' : ActorMethod<[], undefined>,
  'initializeDomains' : ActorMethod<[], undefined>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'isCallerApproved' : ActorMethod<[], boolean>,
  'isStripeConfigured' : ActorMethod<[], boolean>,
  'listApprovals' : ActorMethod<[], Array<UserApprovalInfo>>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'processCsvPreview' : ActorMethod<[string], CsvImportResult>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'removeBookmark' : ActorMethod<[string], undefined>,
  'requestApproval' : ActorMethod<[], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'saveCsvPreview' : ActorMethod<[string, CsvPreview], undefined>,
  'saveStudentProgress' : ActorMethod<[StudentProgress], undefined>,
  'saveStudyStatistics' : ActorMethod<[StudyStatistics], undefined>,
  'searchQuestions' : ActorMethod<[string], Array<Question>>,
  'setApproval' : ActorMethod<[Principal, ApprovalStatus], undefined>,
  'setStripeConfiguration' : ActorMethod<[StripeConfiguration], undefined>,
  'transform' : ActorMethod<[TransformationInput], TransformationOutput>,
  'updateBrandAssets' : ActorMethod<[[] | [string], [] | [string]], undefined>,
  'updateCsvPreviewDelimiter' : ActorMethod<[string, string], undefined>,
  'updateCsvPreviewHeaders' : ActorMethod<[string, Array<string>], undefined>,
  'updateCsvPreviewRows' : ActorMethod<
    [string, Array<Array<string>>],
    undefined
  >,
  'updateCsvPreviewValidationResults' : ActorMethod<
    [string, Array<ValidationResult>],
    undefined
  >,
  'updateDomainTopic' : ActorMethod<[string, string], undefined>,
  'updatePaymentConfiguration' : ActorMethod<
    [[] | [string], [] | [string]],
    undefined
  >,
  'updatePaymentRecord' : ActorMethod<[PaymentRecord], undefined>,
  'updateQuestion' : ActorMethod<[Question], undefined>,
  'updateUserActivity' : ActorMethod<
    [bigint, bigint, bigint, bigint],
    undefined
  >,
  'uploadPaymentProof' : ActorMethod<[string, string, string], undefined>,
  'validateCsvPreviewDelimiter' : ActorMethod<[string], boolean>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
