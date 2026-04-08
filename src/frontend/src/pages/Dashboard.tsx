import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Brain,
  CheckCircle,
  Clock,
  Flame,
  Play,
  Target,
  Timer,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { PaymentStatus, QuestionState, UserRole } from "../backend";
import {
  useGetBookmarks,
  useGetCallerUserProfile,
  useGetCallerUserRole,
  useGetComments,
  useGetQuestions,
  useGetStudentProgress,
  useGetStudyStatistics,
} from "../hooks/useQueries";

export function Dashboard() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: userRole } = useGetCallerUserRole();
  const { data: questions = [] } = useGetQuestions();
  const { data: comments = [] } = useGetComments();
  const { data: studentProgress } = useGetStudentProgress();
  const { data: bookmarks = [] } = useGetBookmarks();
  const { data: studyStatistics } = useGetStudyStatistics();

  const isStudent = userRole === UserRole.user;
  const hasActivePayment = userProfile?.paymentStatus === PaymentStatus.active;

  // Real-time payment status monitoring with toast notifications
  useEffect(() => {
    if (userProfile?.paymentStatus === PaymentStatus.active && isStudent) {
      // Show success message when payment becomes active
      const previousStatus = localStorage.getItem("previousPaymentStatus");
      if (previousStatus && previousStatus !== PaymentStatus.active) {
        toast.success(
          "🎉 Payment approved! You now have full access to all study materials and features.",
        );
      }
      localStorage.setItem("previousPaymentStatus", PaymentStatus.active);
    } else if (userProfile?.paymentStatus) {
      localStorage.setItem("previousPaymentStatus", userProfile.paymentStatus);
    }
  }, [userProfile?.paymentStatus, isStudent]);

  const stats = useMemo(() => {
    const publishedQuestions = questions.filter(
      (q) => q.state === QuestionState.published,
    );
    const totalQuestions = publishedQuestions.length;

    // Group questions by domain
    const domainStats = publishedQuestions.reduce(
      (acc, question) => {
        if (!acc[question.domain]) {
          acc[question.domain] = { total: 0 };
        }
        acc[question.domain].total++;
        return acc;
      },
      {} as Record<string, { total: number }>,
    );

    const userComments = comments.filter(
      (c) => c.user.toString() === userProfile?.name,
    );

    return {
      totalQuestions,
      domains: Object.keys(domainStats).length,
      userComments: userComments.length,
      domainStats: Object.entries(domainStats).map(([domain, stats]) => ({
        domain,
        total: stats.total,
      })),
    };
  }, [questions, comments, userProfile]);

  // Progress calculations with dynamic updates
  const progressData = useMemo(() => {
    if (!studentProgress) {
      return {
        completedQuestions: 0,
        accuracy: 0,
        totalAttempts: 0,
        correctAnswers: 0,
        streak: 0,
        badges: [],
        weakAreas: [],
        progressPercentage: 0,
        performanceLevel: "Beginner",
      };
    }

    const accuracy = Number(studentProgress.accuracy) * 100;
    const completedQuestions = Number(studentProgress.completedQuestions);
    const totalAttempts = Number(studentProgress.totalAttempts);
    const correctAnswers = Number(studentProgress.correctAnswers);
    const streak = Number(studentProgress.streak);

    // Calculate progress percentage based on total available questions
    const progressPercentage =
      stats.totalQuestions > 0
        ? (completedQuestions / stats.totalQuestions) * 100
        : 0;

    // Determine performance level
    let performanceLevel = "Beginner";
    if (accuracy >= 90) performanceLevel = "Expert";
    else if (accuracy >= 80) performanceLevel = "Advanced";
    else if (accuracy >= 70) performanceLevel = "Intermediate";
    else if (accuracy >= 60) performanceLevel = "Developing";

    return {
      completedQuestions,
      accuracy,
      totalAttempts,
      correctAnswers,
      streak,
      badges: studentProgress.badges,
      weakAreas: studentProgress.weakAreas,
      progressPercentage,
      performanceLevel,
    };
  }, [studentProgress, stats.totalQuestions]);

  // Real study statistics from backend
  const realStudyStats = useMemo(() => {
    if (!studyStatistics) {
      return {
        practiceQuestions: 0,
        timedSessions: 0,
        reviewSessions: 0,
        practiceAccuracy: 0,
        timedAccuracy: 0,
        reviewAccuracy: 0,
        totalTimeSpent: 0,
        totalSessionsCompleted: 0,
      };
    }

    return {
      practiceQuestions: Number(
        studyStatistics.practiceModeStats.questionsAttempted,
      ),
      timedSessions: Number(studyStatistics.timedModeStats.sessionsCompleted),
      reviewSessions: Number(studyStatistics.reviewModeStats.sessionsCompleted),
      practiceAccuracy: studyStatistics.practiceModeStats.accuracyPercentage,
      timedAccuracy: studyStatistics.timedModeStats.accuracyPercentage,
      reviewAccuracy: studyStatistics.reviewModeStats.accuracyPercentage,
      totalTimeSpent: Number(studyStatistics.aggregateStats.totalTimeSpent),
      totalSessionsCompleted: Number(
        studyStatistics.aggregateStats.totalSessionsCompleted,
      ),
    };
  }, [studyStatistics]);

  // Chart data for weak areas
  const weakAreasChartData = useMemo(() => {
    return progressData.weakAreas.slice(0, 5).map((area, index) => ({
      area,
      score: Math.max(30, 80 - index * 10), // Mock scores for visualization
      color: `hsl(${index * 60}, 70%, 50%)`,
    }));
  }, [progressData.weakAreas]);

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.active:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case PaymentStatus.pending:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case PaymentStatus.expired:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPaymentStatusText = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.active:
        return "Active";
      case PaymentStatus.pending:
        return "Pending";
      case PaymentStatus.expired:
        return "Expired";
      default:
        return "Unknown";
    }
  };

  const getPerformanceLevelColor = (level: string) => {
    switch (level) {
      case "Expert":
        return "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200";
      case "Advanced":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200";
      case "Intermediate":
        return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200";
      case "Developing":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatTime = (nanoseconds: number) => {
    const seconds = Math.floor(nanoseconds / 1_000_000_000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${seconds}s`;
  };

  const _formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {userProfile?.name}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your progress and continue your SMLE preparation journey.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            className={getPaymentStatusColor(
              userProfile?.paymentStatus || PaymentStatus.pending,
            )}
          >
            {getPaymentStatusText(
              userProfile?.paymentStatus || PaymentStatus.pending,
            )}
          </Badge>
          {isStudent && (
            <Badge
              className={getPerformanceLevelColor(
                progressData.performanceLevel,
              )}
            >
              {progressData.performanceLevel}
            </Badge>
          )}
        </div>
      </div>

      {/* Payment Status Alert - Only show for students with non-active payments */}
      {isStudent && !hasActivePayment && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-800 dark:text-yellow-200">
                Payment Required
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Your payment is{" "}
              {userProfile?.paymentStatus === PaymentStatus.pending
                ? "pending"
                : "expired"}
              . Please{" "}
              <Link
                to="/profile"
                className="text-yellow-800 dark:text-yellow-200 underline hover:text-yellow-900 dark:hover:text-yellow-100 font-medium"
              >
                complete your payment
              </Link>{" "}
              to access all study materials and features.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Active Payment Confirmation - Show for students with active payments */}
      {isStudent && hasActivePayment && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800 dark:text-green-200">
                Payment Active
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-green-700 dark:text-green-300">
              Your subscription is active! You have full access to all study
              materials, questions, and features.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Student Progress Overview - Only show for students with active payment */}
      {isStudent && hasActivePayment && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Questions Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progressData.completedQuestions}
              </div>
              <p className="text-xs text-muted-foreground">
                of {stats.totalQuestions} total questions
              </p>
              <Progress
                value={progressData.progressPercentage}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Accuracy Rate
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progressData.accuracy.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {progressData.correctAnswers} of {progressData.totalAttempts}{" "}
                correct
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Streak
              </CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {progressData.streak}
              </div>
              <p className="text-xs text-muted-foreground">consecutive days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Badges Earned
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progressData.badges.length}
              </div>
              <p className="text-xs text-muted-foreground">
                achievements unlocked
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* General Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Questions
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              Available for practice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domains</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.domains}</div>
            <p className="text-xs text-muted-foreground">
              SMLE domains covered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userComments}</div>
            <p className="text-xs text-muted-foreground">Your contributions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookmarked</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookmarks.length}</div>
            <p className="text-xs text-muted-foreground">Questions saved</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Progress Details - Only show for students with active payment */}
      {isStudent && hasActivePayment && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Badges Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <CardTitle>Achievement Badges</CardTitle>
              </div>
              <CardDescription>
                Your earned achievements and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {progressData.badges.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {progressData.badges.map((badge) => (
                    <div
                      key={badge || "badge-entry"}
                      className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg"
                    >
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{badge}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No badges earned yet</p>
                  <p className="text-xs text-muted-foreground">
                    Complete questions to unlock achievements!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weak Areas Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-red-500" />
                <CardTitle>Areas for Improvement</CardTitle>
              </div>
              <CardDescription>
                Focus on these domains to improve your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weakAreasChartData.length > 0 ? (
                <ChartContainer
                  config={{
                    score: {
                      label: "Performance Score",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weakAreasChartData}>
                      <XAxis
                        dataKey="area"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="score" fill="var(--color-score)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="text-center py-6">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No weak areas identified
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Complete more questions to get personalized insights
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Domain Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Question Distribution by Domain</CardTitle>
          <CardDescription>
            Overview of available questions across different SMLE domains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.domainStats.map((domain) => (
            <div key={domain.domain} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{domain.domain}</p>
                  <p className="text-sm text-muted-foreground">
                    {domain.total} questions
                  </p>
                </div>
                <Badge variant="outline">{domain.total}</Badge>
              </div>
              <Progress
                value={(domain.total / stats.totalQuestions) * 100}
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Your Study Statistics - Real data from backend */}
      {isStudent && hasActivePayment && (
        <Card>
          <CardHeader>
            <CardTitle>Your Study Statistics</CardTitle>
            <CardDescription>
              Real-time progress across different study modes with dynamic
              updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Practice Mode Stats */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-chart-1/10 rounded-lg">
                    <Brain className="h-4 w-4 text-chart-1" />
                  </div>
                  <div>
                    <h4 className="font-medium text-chart-1">Practice Mode</h4>
                    <p className="text-xs text-muted-foreground">
                      Unlimited practice sessions
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-chart-1">
                      {realStudyStats.practiceQuestions}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Questions Attempted
                    </p>
                  </div>
                  {studyStatistics && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Accuracy:</span>
                        <span className="font-medium">
                          {realStudyStats.practiceAccuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Correct:</span>
                        <span className="font-medium">
                          {Number(
                            studyStatistics.practiceModeStats.questionsCorrect,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Time Spent:</span>
                        <span className="font-medium">
                          {formatTime(
                            Number(studyStatistics.practiceModeStats.timeSpent),
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timed Mode Stats */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-chart-2/10 rounded-lg">
                    <Clock className="h-4 w-4 text-chart-2" />
                  </div>
                  <div>
                    <h4 className="font-medium text-chart-2">Timed Mode</h4>
                    <p className="text-xs text-muted-foreground">
                      Exam simulation sessions
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-chart-2">
                      {realStudyStats.timedSessions}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sessions Completed
                    </p>
                  </div>
                  {studyStatistics && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Accuracy:</span>
                        <span className="font-medium">
                          {realStudyStats.timedAccuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Questions:</span>
                        <span className="font-medium">
                          {Number(
                            studyStatistics.timedModeStats.questionsAttempted,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Time Spent:</span>
                        <span className="font-medium">
                          {formatTime(
                            Number(studyStatistics.timedModeStats.timeSpent),
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Mode Stats */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-chart-3/10 rounded-lg">
                    <BookOpen className="h-4 w-4 text-chart-3" />
                  </div>
                  <div>
                    <h4 className="font-medium text-chart-3">Review Mode</h4>
                    <p className="text-xs text-muted-foreground">
                      Question review sessions
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-chart-3">
                      {realStudyStats.reviewSessions}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Review Sessions
                    </p>
                  </div>
                  {studyStatistics && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Accuracy:</span>
                        <span className="font-medium">
                          {realStudyStats.reviewAccuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Questions:</span>
                        <span className="font-medium">
                          {Number(
                            studyStatistics.reviewModeStats.questionsAttempted,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Time Spent:</span>
                        <span className="font-medium">
                          {formatTime(
                            Number(studyStatistics.reviewModeStats.timeSpent),
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Overall Statistics */}
            {studyStatistics && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-4">Overall Performance</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {Number(
                        studyStatistics.aggregateStats.totalQuestionsAttempted,
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total Questions
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {studyStatistics.aggregateStats.overallAccuracy.toFixed(
                        1,
                      )}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Overall Accuracy
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {realStudyStats.totalSessionsCompleted}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total Sessions
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {formatTime(realStudyStats.totalTimeSpent)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Time</p>
                  </div>
                </div>
              </div>
            )}

            {/* No Data State */}
            {!studyStatistics && (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  No study statistics yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Start practicing questions to see your progress across
                  different study modes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Only show if student has active payment or is admin */}
      {(!isStudent || hasActivePayment) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/study">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="bg-chart-1/10 p-2 rounded-lg">
                    <Brain className="h-5 w-5 text-chart-1" />
                  </div>
                  <CardTitle className="text-lg">Practice Mode</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Start practicing with unlimited questions and immediate
                  feedback
                </CardDescription>
                <Button className="w-full mt-4" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Start Practice
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/study">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="bg-chart-2/10 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-chart-2" />
                  </div>
                  <CardTitle className="text-lg">Timed Mode</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Simulate real exam conditions with time constraints
                </CardDescription>
                <Button className="w-full mt-4" size="sm" variant="outline">
                  <Timer className="h-4 w-4 mr-2" />
                  Start Timed
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/study">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="bg-chart-3/10 p-2 rounded-lg">
                    <BookOpen className="h-5 w-5 text-chart-3" />
                  </div>
                  <CardTitle className="text-lg">Review Mode</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Review bookmarked questions and focus on weak areas
                </CardDescription>
                <Button className="w-full mt-4" size="sm" variant="outline">
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                  Start Review
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Bookmarked Questions Quick Access - Only show for students with active payment */}
      {isStudent && hasActivePayment && bookmarks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bookmark className="h-5 w-5 text-primary" />
                <CardTitle>Bookmarked Questions</CardTitle>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/study">View All</Link>
              </Button>
            </div>
            <CardDescription>
              Quick access to your saved questions for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                You have {bookmarks.length} bookmarked question
                {bookmarks.length !== 1 ? "s" : ""} ready for review
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
