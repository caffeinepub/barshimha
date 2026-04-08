import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AiAssistantConfig,
  type AiChatMessage,
  type AiChatRequest,
  type Bookmark,
  type BrandAssets,
  type Comment,
  type CsvImportResult,
  type CsvPreview,
  type Domain,
  type PaymentConfiguration,
  PaymentMethod,
  type PaymentRecord,
  PaymentStatus,
  type Question,
  QuestionState,
  QuestionType,
  type StudentProgress,
  type StudyMode,
  type StudyStatistics,
  type UserActivity,
  type UserProfile,
  type UserRole,
  type UserStats,
  ValidationResult,
} from "../backend";
import { useActor } from "./useActor";

// Local types for features not wired in this backend
export interface DomainTopic {
  id: string;
  name: string;
  type: DomainTopicType;
  updatedAt: bigint;
  createdAt: bigint;
}
export const DomainTopicType = {
  domain: "domain" as const,
  topic: "topic" as const,
};
export type DomainTopicType =
  (typeof DomainTopicType)[keyof typeof DomainTopicType];
export interface StripeConfiguration {
  publishableKey: string;
  secretKey: string;
}
export interface ShoppingItem {
  id: string;
  quantity: number;
  price: number;
  name: string;
}

// Helper to convert backend Domain to DomainTopic
function domainToDomainTopic(d: Domain): DomainTopic {
  return {
    id: d.id,
    name: d.name,
    type: DomainTopicType.domain,
    createdAt: d.createdAt,
    updatedAt: d.createdAt,
  };
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    refetchIntervalInBackground: true,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.refetchQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ["currentUserRole"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      // Don't retry authentication errors
      const errorMessage = error?.message || error?.toString() || "";
      if (
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Authentication required") ||
        errorMessage.includes("admin")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// User Management Queries
export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, UserProfile][]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    refetchIntervalInBackground: true,
  });
}

export function useGetUserStats() {
  const { actor, isFetching } = useActor();

  return useQuery<UserStats>({
    queryKey: ["userStats"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getUserStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserActivities() {
  const { actor, isFetching } = useActor();

  return useQuery<UserActivity[]>({
    queryKey: ["userActivities"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserActivities();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.assignCallerUserRole(user, role);
      } catch (error: any) {
        const errorMessage = error.message || error.toString();

        if (errorMessage.includes("Cannot change admin role to student")) {
          throw new Error(
            "Admin role protection: Cannot change admin users to student role. Admin users must retain their administrative privileges.",
          );
        }
        if (
          errorMessage.includes("Unauthorized: Only admins can assign roles")
        ) {
          throw new Error(
            "You do not have permission to assign user roles. Only administrators can perform this action.",
          );
        }
        throw new Error(`Role assignment failed: ${errorMessage}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      queryClient.refetchQueries({ queryKey: ["allUsers"] });
      queryClient.refetchQueries({ queryKey: ["userStats"] });
    },
  });
}

export function useUpdateUserActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      loginCount,
      questionAttempts,
      commentCount,
      lastLogin,
    }: {
      loginCount: bigint;
      questionAttempts: bigint;
      commentCount: bigint;
      lastLogin: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateUserActivity(
        loginCount,
        questionAttempts,
        commentCount,
        lastLogin,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userActivities"] });
    },
  });
}

// Domain Management Queries
export function useGetDomains() {
  const { actor, isFetching } = useActor();

  return useQuery<DomainTopic[]>({
    queryKey: ["domains"],
    queryFn: async () => {
      if (!actor) return [];
      const domains = await actor.getDomains();
      return domains.map(domainToDomainTopic);
    },
    enabled: !!actor && !isFetching,
  });
}

// Stub — initializeDomains no longer exists in backend; kept for call-site compatibility
export function useInitializeDomains() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // no-op: domains are fixed in the backend
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });
}

// getDomainTopics — maps backend domains to DomainTopic shape
export function useGetDomainTopics() {
  const { actor, isFetching } = useActor();

  return useQuery<DomainTopic[]>({
    queryKey: ["domainTopics"],
    queryFn: async () => {
      if (!actor) return [];
      const domains = await actor.getDomains();
      return domains.map(domainToDomainTopic);
    },
    enabled: !!actor && !isFetching,
  });
}

// getAllDomainsAndTopics — maps backend getAllDomains to DomainTopic shape
export function useGetAllDomainsAndTopics() {
  const { actor, isFetching } = useActor();

  return useQuery<DomainTopic[]>({
    queryKey: ["allDomainsAndTopics"],
    queryFn: async () => {
      if (!actor) return [];
      const domains = await actor.getAllDomains();
      return domains.map(domainToDomainTopic);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllQuestions() {
  const { actor, isFetching } = useActor();

  return useQuery<Question[]>({
    queryKey: ["allQuestions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllQuestions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddDomainTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_args: { id: string; name: string; type: string }) => {
      // Domains are fixed in backend — no-op
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      queryClient.invalidateQueries({ queryKey: ["domainTopics"] });
      queryClient.invalidateQueries({ queryKey: ["allDomainsAndTopics"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["allQuestions"] });
    },
  });
}

export function useUpdateDomainTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_args: { id: string; newName: string }) => {
      // Domains are fixed in backend — no-op
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      queryClient.invalidateQueries({ queryKey: ["domainTopics"] });
      queryClient.invalidateQueries({ queryKey: ["allDomainsAndTopics"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["allQuestions"] });
    },
  });
}

export function useDeleteDomainTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_id: string) => {
      // Domains are fixed in backend — no-op
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      queryClient.invalidateQueries({ queryKey: ["domainTopics"] });
      queryClient.invalidateQueries({ queryKey: ["allDomainsAndTopics"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["allQuestions"] });
    },
  });
}

// Question Queries
export function useGetQuestions() {
  const { actor, isFetching } = useActor();

  return useQuery<Question[]>({
    queryKey: ["questions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getQuestions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetQuestionsByMode(mode: StudyMode) {
  const { actor, isFetching } = useActor();

  return useQuery<Question[]>({
    queryKey: ["questions", "mode", mode],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getQuestionsByMode(mode);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetQuestionsByFilter(domain?: string, difficulty?: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Question[]>({
    queryKey: ["questions", "filter", domain, difficulty],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getQuestionsByFilter(domain || null, difficulty || null);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchQuestions(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Question[]>({
    queryKey: ["questions", "search", searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      if (!searchTerm.trim()) return [];
      return actor.searchQuestions(searchTerm);
    },
    enabled: !!actor && !isFetching && !!searchTerm.trim(),
  });
}

export function useAddQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: Question) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addQuestion(question);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["allQuestions"] });
    },
  });
}

export function useUpdateQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: Question) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateQuestion(question);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["allQuestions"] });
    },
  });
}

export function useDeleteQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteQuestion(questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["allQuestions"] });
    },
  });
}

// Enhanced CSV Preview Queries with robust error handling and authentication checks
export function useSaveCsvPreview() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      previewId,
      preview,
    }: { previewId: string; preview: CsvPreview }) => {
      if (!actor)
        throw new Error(
          "Backend connection not available. Please check your authentication and try again.",
        );

      try {
        return await actor.saveCsvPreview(previewId, preview);
      } catch (error: any) {
        const errorMessage = error.message || error.toString();

        if (
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("admin")
        ) {
          throw new Error(
            "Admin access required to save CSV preview. Please ensure you have administrator privileges.",
          );
        }
        if (errorMessage.includes("Authentication required")) {
          throw new Error(
            "Your session has expired. Please log in again to continue.",
          );
        }
        if (
          errorMessage.includes("CSV preview not found") ||
          errorMessage.includes("expired")
        ) {
          throw new Error(
            "CSV preview has expired or was not found. Please re-upload your file and try again.",
          );
        }
        throw new Error(`Failed to save preview: ${errorMessage}`);
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry authentication or authorization errors
      const errorMessage = error.message || error.toString();
      if (
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Authentication required") ||
        errorMessage.includes("admin") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("not found")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useGetCsvPreview(previewId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<CsvPreview | null>({
    queryKey: ["csvPreview", previewId],
    queryFn: async () => {
      if (!actor) throw new Error("Backend connection not available");

      try {
        return await actor.getCsvPreview(previewId);
      } catch (error: any) {
        const errorMessage = error.message || error.toString();

        if (
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("admin")
        ) {
          throw new Error(
            "Admin access required to view CSV preview. Please ensure you have administrator privileges.",
          );
        }
        if (errorMessage.includes("Authentication required")) {
          throw new Error(
            "Your session has expired. Please log in again to continue.",
          );
        }
        if (
          errorMessage.includes("CSV preview not found") ||
          errorMessage.includes("expired")
        ) {
          throw new Error(
            "CSV preview has expired or was not found. Please re-upload your file and try again.",
          );
        }
        throw new Error(`Failed to load preview: ${errorMessage}`);
      }
    },
    enabled: !!actor && !isFetching && !!previewId,
    retry: (failureCount, error: any) => {
      // Don't retry authentication, authorization, or not found errors
      const errorMessage = error.message || error.toString();
      if (
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Authentication required") ||
        errorMessage.includes("admin") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("not found")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
  });
}

export function useDeleteCsvPreview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (previewId: string) => {
      if (!actor) throw new Error("Backend connection not available");

      try {
        return await actor.deleteCsvPreview(previewId);
      } catch (error: any) {
        const errorMessage = error.message || error.toString();

        if (
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("admin")
        ) {
          throw new Error("Admin access required to delete CSV preview.");
        }
        if (errorMessage.includes("Authentication required")) {
          throw new Error("Your session has expired. Please log in again.");
        }
        // For delete operations, don't throw errors for "not found" - it's already deleted
        if (
          errorMessage.includes("not found") ||
          errorMessage.includes("expired")
        ) {
          return; // Silently succeed
        }
        throw new Error(`Failed to delete preview: ${errorMessage}`);
      }
    },
    onSuccess: (_, previewId) => {
      queryClient.removeQueries({ queryKey: ["csvPreview", previewId] });
    },
    retry: (failureCount, error: any) => {
      const errorMessage = error.message || error.toString();
      if (
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Authentication required") ||
        errorMessage.includes("admin") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("expired")
      ) {
        return false;
      }
      return failureCount < 1; // Only retry once for delete operations
    },
  });
}

// CSV Preview Processing Queries with enhanced error handling
export function useProcessCsvPreview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (previewId: string): Promise<CsvImportResult> => {
      if (!actor)
        throw new Error(
          "Backend connection not available. Please check your authentication and try again.",
        );

      try {
        return await actor.processCsvPreview(previewId);
      } catch (error: any) {
        const errorMessage = error.message || error.toString();

        if (
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("admin")
        ) {
          throw new Error(
            "Admin access required to process CSV import. Please ensure you have administrator privileges.",
          );
        }
        if (errorMessage.includes("Authentication required")) {
          throw new Error(
            "Your session has expired. Please log in again to continue.",
          );
        }
        if (
          errorMessage.includes("CSV preview not found") ||
          errorMessage.includes("expired")
        ) {
          throw new Error(
            "CSV preview has expired or was not found. Please re-upload your file and try again.",
          );
        }
        throw new Error(`Import processing failed: ${errorMessage}`);
      }
    },
    onSuccess: () => {
      // Refresh questions list after successful import
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["allQuestions"] });
      queryClient.refetchQueries({ queryKey: ["questions"] });
      queryClient.refetchQueries({ queryKey: ["allQuestions"] });
    },
    retry: (failureCount, error: any) => {
      const errorMessage = error.message || error.toString();
      if (
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Authentication required") ||
        errorMessage.includes("admin") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("not found")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useCancelCsvPreview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (previewId: string) => {
      if (!actor) throw new Error("Backend connection not available");

      try {
        return await actor.cancelCsvPreview(previewId);
      } catch (error: any) {
        const errorMessage = error.message || error.toString();

        // For cancel operations, be more lenient with errors
        if (
          errorMessage.includes("not found") ||
          errorMessage.includes("expired")
        ) {
          return; // Silently succeed - already cancelled/expired
        }
        if (
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("admin")
        ) {
          throw new Error("Admin access required to cancel CSV import.");
        }
        if (errorMessage.includes("Authentication required")) {
          throw new Error("Your session has expired. Please log in again.");
        }
        // Don't throw errors for cancel operations unless critical
        console.warn("Cancel operation warning:", errorMessage);
        return;
      }
    },
    onSuccess: (_, previewId) => {
      queryClient.removeQueries({ queryKey: ["csvPreview", previewId] });
    },
    retry: false, // Don't retry cancel operations
  });
}

// Student Progress Queries
export function useGetStudentProgress() {
  const { actor, isFetching } = useActor();

  return useQuery<StudentProgress | null>({
    queryKey: ["studentProgress"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getStudentProgress();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveStudentProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progress: StudentProgress) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveStudentProgress(progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentProgress"] });
    },
  });
}

// Study Statistics Queries
export function useGetStudyStatistics() {
  const { actor, isFetching } = useActor();

  return useQuery<StudyStatistics | null>({
    queryKey: ["studyStatistics"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getStudyStatistics();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    refetchIntervalInBackground: true,
  });
}

export function useSaveStudyStatistics() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stats: StudyStatistics) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveStudyStatistics(stats);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studyStatistics"] });
      queryClient.refetchQueries({ queryKey: ["studyStatistics"] });
    },
  });
}

// Bookmark Queries
export function useGetBookmarks() {
  const { actor, isFetching } = useActor();

  return useQuery<Bookmark[]>({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBookmarks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddBookmark() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addBookmark(questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useRemoveBookmark() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeBookmark(questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

// Comment Queries
export function useGetComments() {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ["comments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getComments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comment: Comment) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addComment(comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["userActivities"] });
    },
  });
}

export function useApproveComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.approveComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

// Payment Queries with enhanced synchronization
export function useGetPaymentRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<PaymentRecord[]>({
    queryKey: ["paymentRecords"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPaymentRecords();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    refetchIntervalInBackground: true,
  });
}

export function useAddPaymentRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: PaymentRecord) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addPaymentRecord(record);
    },
    onSuccess: () => {
      // Force immediate refresh of all related data
      queryClient.invalidateQueries({ queryKey: ["paymentRecords"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.refetchQueries({ queryKey: ["paymentRecords"] });
      queryClient.refetchQueries({ queryKey: ["currentUserProfile"] });
      queryClient.refetchQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useUpdatePaymentRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: PaymentRecord) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePaymentRecord(record);
    },
    onSuccess: () => {
      // Force immediate refresh of all related data
      queryClient.invalidateQueries({ queryKey: ["paymentRecords"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.refetchQueries({ queryKey: ["paymentRecords"] });
      queryClient.refetchQueries({ queryKey: ["currentUserProfile"] });
      queryClient.refetchQueries({ queryKey: ["allUsers"] });
    },
  });
}

// Enhanced payment approval mutation with immediate real-time updates
export function useApprovePayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentRecordId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.approvePayment(paymentRecordId);
    },
    onSuccess: async () => {
      // Force immediate refresh of all related data to ensure real-time updates
      const refreshPromises = [
        queryClient.invalidateQueries({ queryKey: ["paymentRecords"] }),
        queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["allUsers"] }),
      ];

      await Promise.all(refreshPromises);

      // Force immediate refetch to ensure synchronization across all interfaces
      const refetchPromises = [
        queryClient.refetchQueries({ queryKey: ["paymentRecords"] }),
        queryClient.refetchQueries({ queryKey: ["currentUserProfile"] }),
        queryClient.refetchQueries({ queryKey: ["allUsers"] }),
      ];

      await Promise.all(refetchPromises);
    },
  });
}

// Enhanced payment proof upload with comprehensive error handling
export function useUploadPaymentProof() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentRecordId,
      filePath,
      fileType,
    }: { paymentRecordId: string; filePath: string; fileType: string }) => {
      if (!actor)
        throw new Error(
          "Backend connection not available. Please check your internet connection and try again.",
        );

      try {
        await actor.uploadPaymentProof(paymentRecordId, filePath, fileType);
        return { paymentRecordId, filePath, fileType };
      } catch (error: any) {
        // Enhanced error handling with specific error messages
        const errorMessage = error.message || error.toString();

        if (errorMessage.includes("Authentication required")) {
          throw new Error(
            "You must be logged in to upload payment proof. Please sign in and try again.",
          );
        }
        if (errorMessage.includes("Only students can upload payment proof")) {
          throw new Error(
            "Only students are authorized to upload payment proof. Admin users cannot perform this action.",
          );
        }
        if (
          errorMessage.includes(
            "You can only upload payment proof for your own records",
          )
        ) {
          throw new Error(
            "You can only upload payment proof for your own payment records.",
          );
        }
        if (errorMessage.includes("Unauthorized")) {
          throw new Error(
            "You are not authorized to perform this action. Please ensure you are logged in as a student.",
          );
        }
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("timeout")
        ) {
          throw new Error(
            "Network error occurred. Please check your internet connection and try again.",
          );
        }
        throw new Error(`Upload failed: ${errorMessage}`);
      }
    },
    onSuccess: async () => {
      // Force immediate refresh of all related data
      const refreshPromises = [
        queryClient.invalidateQueries({ queryKey: ["paymentRecords"] }),
        queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["allUsers"] }),
      ];

      await Promise.all(refreshPromises);

      // Force immediate refetch to ensure synchronization
      const refetchPromises = [
        queryClient.refetchQueries({ queryKey: ["paymentRecords"] }),
        queryClient.refetchQueries({ queryKey: ["currentUserProfile"] }),
        queryClient.refetchQueries({ queryKey: ["allUsers"] }),
      ];

      await Promise.all(refetchPromises);
    },
    onError: (error) => {
      console.error("Payment proof upload failed:", error);
      // Still try to refresh data in case of partial success
      queryClient.invalidateQueries({ queryKey: ["paymentRecords"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
    retry: (failureCount, error: any) => {
      // Don't retry authentication or authorization errors
      const errorMessage = error.message || error.toString();
      if (
        errorMessage.includes("Authentication required") ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Only students can upload") ||
        errorMessage.includes("not found")
      ) {
        return false;
      }
      // Retry up to 2 times for network errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

// Simplified payment proof submission - backend now handles record creation automatically
export function useSubmitPaymentProof() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      filePath,
      fileType,
    }: {
      filePath: string;
      fileType: string;
    }) => {
      if (!actor) {
        throw new Error(
          "Backend connection not available. Please check your internet connection and try again.",
        );
      }

      try {
        // Generate a unique payment record ID - backend will create the record automatically
        const paymentRecordId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Upload the payment proof - the backend will handle creating the record if needed
        await actor.uploadPaymentProof(paymentRecordId, filePath, fileType);

        return { paymentRecordId, filePath, fileType };
      } catch (error: any) {
        // Enhanced error handling with specific error messages
        const errorMessage = error.message || error.toString();

        if (errorMessage.includes("Authentication required")) {
          throw new Error(
            "You must be logged in to submit payment proof. Please sign in and try again.",
          );
        }
        if (errorMessage.includes("Only students can upload payment proof")) {
          throw new Error(
            "Only students are authorized to submit payment proof. Admin users cannot perform this action.",
          );
        }
        if (errorMessage.includes("Unauthorized")) {
          throw new Error(
            "You are not authorized to submit payment proof. Please ensure you are logged in as a student.",
          );
        }
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("timeout")
        ) {
          throw new Error(
            "Network error occurred during submission. Please check your internet connection and try again.",
          );
        }
        if (errorMessage.includes("file") || errorMessage.includes("storage")) {
          throw new Error(
            "File upload failed. Please check your file and try again.",
          );
        }
        throw new Error(
          `Submission failed: ${errorMessage}. Please try again or contact support if the problem persists.`,
        );
      }
    },
    onSuccess: async () => {
      // Force immediate refresh of all related data
      const refreshPromises = [
        queryClient.invalidateQueries({ queryKey: ["paymentRecords"] }),
        queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["allUsers"] }),
      ];

      await Promise.all(refreshPromises);

      // Force immediate refetch to ensure synchronization
      const refetchPromises = [
        queryClient.refetchQueries({ queryKey: ["paymentRecords"] }),
        queryClient.refetchQueries({ queryKey: ["currentUserProfile"] }),
        queryClient.refetchQueries({ queryKey: ["allUsers"] }),
      ];

      await Promise.all(refetchPromises);
    },
    onError: (error) => {
      console.error("Payment proof submission failed:", error);
      // Still try to refresh data in case of partial success
      queryClient.invalidateQueries({ queryKey: ["paymentRecords"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
    retry: (failureCount, error: any) => {
      // Don't retry authentication or authorization errors
      const errorMessage = error.message || error.toString();
      if (
        errorMessage.includes("Authentication required") ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Only students can upload")
      ) {
        return false;
      }
      // Retry up to 2 times for network and file errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

// Payment Configuration Queries
export function useGetPaymentConfiguration() {
  const { actor, isFetching } = useActor();

  return useQuery<PaymentConfiguration | null>({
    queryKey: ["paymentConfiguration"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPaymentConfiguration();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdatePaymentConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stcPayBarcodePath,
      localBankDetails,
    }: {
      stcPayBarcodePath: string | null;
      localBankDetails: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePaymentConfiguration(
        stcPayBarcodePath,
        localBankDetails,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentConfiguration"] });
    },
  });
}

// Enhanced Brand Assets Queries with aggressive cache invalidation and real-time updates
export function useGetBrandAssets() {
  const { actor, isFetching } = useActor();

  return useQuery<BrandAssets | null>({
    queryKey: ["brandAssets"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBrandAssets();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 2000, // Refetch every 2 seconds for immediate updates
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider data stale for immediate updates
    gcTime: 0, // Don't cache data
  });
}

export function useUpdateBrandAssets() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      logoPath,
      soundPath,
    }: { logoPath: string | null; soundPath: string | null }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateBrandAssets(logoPath, soundPath);
    },
    onSuccess: async () => {
      // Aggressive cache invalidation for immediate updates
      await queryClient.invalidateQueries({ queryKey: ["brandAssets"] });
      await queryClient.invalidateQueries({ queryKey: ["fileUrl"] });

      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ["brandAssets"] });

      // Clear all file URL caches to force reload
      queryClient.removeQueries({ queryKey: ["fileUrl"] });

      // Trigger a global cache invalidation for asset-related queries
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["brandAssets"] });
        queryClient.invalidateQueries({ queryKey: ["fileUrl"] });
      }, 100);
    },
  });
}

// Stripe Queries — stubs (Stripe not wired in this backend)
export function useIsStripeConfigured() {
  return useQuery<boolean>({
    queryKey: ["stripeConfigured"],
    queryFn: async () => false,
    enabled: false,
  });
}

export function useSetStripeConfiguration() {
  return useMutation({
    mutationFn: async (_config: {
      secretKey: string;
      allowedCountries: string[];
    }) => {
      // no-op
    },
  });
}

export type CheckoutSession = {
  id: string;
  url: string;
};

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (
      _items: { id: string; quantity: number }[],
    ): Promise<CheckoutSession> => {
      throw new Error("Stripe checkout not configured");
    },
  });
}

// AI Assistant Queries
export function useGetAiAssistantConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<AiAssistantConfig | null>({
    queryKey: ["aiAssistantConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAiAssistantConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetAiAssistantConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      apiKey,
      enabled,
    }: { apiKey: string; enabled: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setAiAssistantConfig(apiKey, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiAssistantConfig"] });
      queryClient.invalidateQueries({ queryKey: ["aiAssistantEnabled"] });
    },
  });
}

export function useDeleteAiAssistantConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteAiAssistantConfig();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiAssistantConfig"] });
      queryClient.invalidateQueries({ queryKey: ["aiAssistantEnabled"] });
    },
  });
}

export function useIsAiAssistantEnabled() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["aiAssistantEnabled"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isAiAssistantEnabled();
      } catch (error) {
        console.error("Error checking AI assistant status:", error);
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

// AI Chat Integration - Enhanced with proper response handling
export function useSendAiMessage() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      messages,
    }: {
      messages: Array<{ role: string; content: string }>;
    }): Promise<string> => {
      if (!actor) throw new Error("Backend connection not available");

      try {
        // Convert messages to backend format
        const chatMessages: AiChatMessage[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Create request object
        const request: AiChatRequest = {
          messages: chatMessages,
        };

        // Call backend which will communicate with DeepSeek API and extract the response
        const response = await actor.deepSeekChat(request);

        // The backend now properly extracts and returns the content from choices[0].message.content
        // Check if it's an error message
        if (
          response.includes("could not process your request") ||
          response.includes("try again")
        ) {
          throw new Error(response);
        }

        return response;
      } catch (error: any) {
        const errorMessage = error.message || error.toString();

        // Handle specific error cases
        if (errorMessage.includes("Payment required")) {
          throw new Error(
            "Payment required: Please complete payment to access AI Assistant",
          );
        }
        if (errorMessage.includes("AI assistant is not configured")) {
          throw new Error(
            "AI Assistant is not configured. Please contact your administrator.",
          );
        }
        if (errorMessage.includes("AI assistant is currently disabled")) {
          throw new Error(
            "AI Assistant is currently disabled. Please contact your administrator.",
          );
        }
        if (
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("Authentication required")
        ) {
          throw new Error(
            "Authentication required: Please log in to use AI Assistant",
          );
        }
        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("quota")
        ) {
          throw new Error(
            "AI service rate limit reached. Please try again in a moment.",
          );
        }
        if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("network")
        ) {
          throw new Error(
            "Network error: Please check your connection and try again.",
          );
        }
        throw new Error(`AI Assistant error: ${errorMessage}`);
      }
    },
    retry: (failureCount, error: any) => {
      const errorMessage = error.message || error.toString();

      // Don't retry authentication, authorization, or configuration errors
      if (
        errorMessage.includes("Authentication required") ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Payment required") ||
        errorMessage.includes("not configured") ||
        errorMessage.includes("disabled")
      ) {
        return false;
      }

      // Retry network errors up to 2 times
      if (
        errorMessage.includes("network") ||
        errorMessage.includes("timeout")
      ) {
        return failureCount < 2;
      }

      // Don't retry rate limit errors
      if (
        errorMessage.includes("rate limit") ||
        errorMessage.includes("quota")
      ) {
        return false;
      }

      // Retry other errors once
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
