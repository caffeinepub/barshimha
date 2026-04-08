import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserActivity {
    user: Principal;
    loginCount: bigint;
    commentCount: bigint;
    lastLogin: bigint;
    questionAttempts: bigint;
}
export interface AiChatRequest {
    messages: Array<AiChatMessage>;
}
export interface PaymentRecord {
    id: string;
    status: PaymentStatus;
    method: PaymentMethod;
    createdAt: bigint;
    user: Principal;
    updatedAt: bigint;
    proof?: PaymentProof;
    amount: bigint;
}
export interface Bookmark {
    createdAt: bigint;
    user: Principal;
    questionId: string;
}
export interface CsvPreview {
    validationResults: Array<ValidationResult>;
    rows: Array<Array<string>>;
    importMode?: ImportMode;
    headers: Array<string>;
    delimiter: string;
}
export interface CsvImportResult {
    errors: Array<string>;
    importedCount: bigint;
    message: string;
    success: boolean;
}
export interface AiAssistantConfig {
    lastUpdated: bigint;
    enabled: boolean;
    apiKey: string;
}
export interface PaymentConfiguration {
    localBankDetails?: string;
    updatedAt: bigint;
    stcPayBarcodePath?: string;
}
export interface PaymentProof {
    filePath: string;
    fileType: string;
    uploadedAt: bigint;
}
export interface BrandAssets {
    soundPath?: string;
    logoPath?: string;
    updatedAt: bigint;
}
export interface StudentProgress {
    streak: bigint;
    badges: Array<string>;
    totalAttempts: bigint;
    completedQuestions: bigint;
    correctAnswers: bigint;
    weakAreas: Array<string>;
    accuracy: number;
}
export interface AiChatMessage {
    content: string;
    role: string;
}
export interface Comment {
    id: string;
    content: string;
    createdAt: bigint;
    user: Principal;
    approved: boolean;
    questionId: string;
}
export interface ModeStats {
    accuracyPercentage: number;
    timeSpent: bigint;
    questionsAttempted: bigint;
    sessionsCompleted: bigint;
    questionsCorrect: bigint;
}
export interface Domain {
    id: string;
    name: string;
    createdAt: bigint;
}
export interface AggregateStats {
    totalTimeSpent: bigint;
    totalQuestionsAttempted: bigint;
    totalQuestionsCorrect: bigint;
    totalSessionsCompleted: bigint;
    overallAccuracy: number;
}
export interface ValidationResult {
    errors: Array<string>;
    rowIndex: bigint;
    isValid: boolean;
}
export interface StudyStatistics {
    aggregateStats: AggregateStats;
    reviewModeStats: ModeStats;
    timedModeStats: ModeStats;
    practiceModeStats: ModeStats;
}
export interface Question {
    id: string;
    content: string;
    domain: string;
    explanation: string;
    createdAt: bigint;
    questionType: QuestionType;
    version: bigint;
    updatedAt: bigint;
    state: QuestionState;
    correctAnswers: Array<bigint>;
    options: Array<string>;
}
export interface UserStats {
    newUsersLast24h: bigint;
    newUsersLast30d: bigint;
    totalUsers: bigint;
    newUsersLast7d: bigint;
}
export interface UserProfile {
    paymentStatus: PaymentStatus;
    name: string;
    paymentProof?: PaymentProof;
    registrationTime: bigint;
}
export enum ImportMode {
    other = "other",
    users = "users",
    questions = "questions"
}
export enum PaymentMethod {
    localBank = "localBank",
    stcBank = "stcBank"
}
export enum PaymentStatus {
    active = "active",
    expired = "expired",
    pending = "pending"
}
export enum QuestionState {
    published = "published",
    draft = "draft",
    archived = "archived"
}
export enum QuestionType {
    multiSelect = "multiSelect",
    singleChoice = "singleChoice",
    numeric = "numeric",
    trueFalse = "trueFalse"
}
export enum StudyMode {
    review = "review",
    timed = "timed",
    practice = "practice"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBookmark(questionId: string): Promise<void>;
    addComment(comment: Comment): Promise<void>;
    addPaymentRecord(record: PaymentRecord): Promise<void>;
    addQuestion(question: Question): Promise<void>;
    approveComment(commentId: string): Promise<void>;
    approvePayment(paymentRecordId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelCsvPreview(previewId: string): Promise<void>;
    deepSeekChat(request: AiChatRequest): Promise<string>;
    deleteAiAssistantConfig(): Promise<void>;
    deleteComment(commentId: string): Promise<void>;
    deleteCsvPreview(previewId: string): Promise<void>;
    deleteQuestion(questionId: string): Promise<void>;
    getAiAssistantConfig(): Promise<AiAssistantConfig | null>;
    getAllDomains(): Promise<Array<Domain>>;
    getAllQuestions(): Promise<Array<Question>>;
    getAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    getBookmarks(): Promise<Array<Bookmark>>;
    getBrandAssets(): Promise<BrandAssets | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(): Promise<Array<Comment>>;
    getCsvPreview(previewId: string): Promise<CsvPreview>;
    getCsvPreviewDelimiter(previewId: string): Promise<string>;
    getCsvPreviewHeaders(previewId: string): Promise<Array<string>>;
    getCsvPreviewRows(previewId: string): Promise<Array<Array<string>>>;
    getCsvPreviewValidationResults(previewId: string): Promise<Array<ValidationResult>>;
    getDomains(): Promise<Array<Domain>>;
    getOrphanQuestions(): Promise<Array<Question>>;
    getPaymentConfiguration(): Promise<PaymentConfiguration | null>;
    getPaymentRecords(): Promise<Array<PaymentRecord>>;
    getQuestions(): Promise<Array<Question>>;
    getQuestionsByFilter(domain: string | null, difficulty: string | null): Promise<Array<Question>>;
    getQuestionsByMode(mode: StudyMode): Promise<Array<Question>>;
    getQuestionsWithDomains(): Promise<Array<Question>>;
    getStudentProgress(): Promise<StudentProgress | null>;
    getStudyStatistics(): Promise<StudyStatistics | null>;
    getUserActivities(): Promise<Array<UserActivity>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserStats(): Promise<UserStats>;
    /**
     * / First user to call this becomes admin. Subsequent calls are no-ops.
     */
    initializeAccessControl(): Promise<void>;
    isAiAssistantEnabled(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Import questions from a CSV preview.
     * / Expected row columns: id | content | options (pipe-separated) | correctAnswer (0-based Nat) | explanation | _ | domain
     */
    processCsvPreview(previewId: string): Promise<CsvImportResult>;
    /**
     * / Register the caller as a user (if not already assigned a role).
     */
    registerUser(name: string): Promise<void>;
    removeBookmark(questionId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCsvPreview(previewId: string, preview: CsvPreview): Promise<void>;
    saveStudentProgress(progress: StudentProgress): Promise<void>;
    saveStudyStatistics(stats: StudyStatistics): Promise<void>;
    searchQuestions(searchTerm: string): Promise<Array<Question>>;
    setAiAssistantConfig(apiKey: string, enabled: boolean): Promise<void>;
    updateBrandAssets(logoPath: string | null, soundPath: string | null): Promise<void>;
    updateCsvPreviewDelimiter(previewId: string, newDelimiter: string): Promise<void>;
    updateCsvPreviewHeaders(previewId: string, newHeaders: Array<string>): Promise<void>;
    updateCsvPreviewImportMode(previewId: string, newImportMode: ImportMode | null): Promise<void>;
    updateCsvPreviewRows(previewId: string, newRows: Array<Array<string>>): Promise<void>;
    updateCsvPreviewValidationResults(previewId: string, newValidationResults: Array<ValidationResult>): Promise<void>;
    updatePaymentConfiguration(stcPayBarcodePath: string | null, localBankDetails: string | null): Promise<void>;
    updatePaymentRecord(record: PaymentRecord): Promise<void>;
    updateQuestion(question: Question): Promise<void>;
    updateUserActivity(loginCount: bigint, questionAttempts: bigint, commentCount: bigint, lastLogin: bigint): Promise<void>;
    uploadPaymentProof(paymentRecordId: string, filePath: string, fileType: string): Promise<void>;
    validateCsvPreviewDelimiter(previewId: string): Promise<boolean>;
}
