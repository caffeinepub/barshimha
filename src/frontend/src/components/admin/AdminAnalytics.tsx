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
import {
  Activity,
  BookOpen,
  Calendar,
  DollarSign,
  MessageCircle,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { PaymentStatus, QuestionState } from "../../backend";
import {
  useGetComments,
  useGetPaymentRecords,
  useGetQuestions,
  useGetUserActivities,
  useGetUserStats,
} from "../../hooks/useQueries";

export function AdminAnalytics() {
  const { data: questions = [] } = useGetQuestions();
  const { data: comments = [] } = useGetComments();
  const { data: paymentRecords = [] } = useGetPaymentRecords();
  const { data: userStats } = useGetUserStats();
  const { data: userActivities = [] } = useGetUserActivities();

  const analytics = useMemo(() => {
    // Question analytics
    const publishedQuestions = questions.filter(
      (q) => q.state === QuestionState.published,
    );
    const draftQuestions = questions.filter(
      (q) => q.state === QuestionState.draft,
    );
    const archivedQuestions = questions.filter(
      (q) => q.state === QuestionState.archived,
    );

    // Domain distribution
    const domainData = publishedQuestions.reduce(
      (acc, question) => {
        acc[question.domain] = (acc[question.domain] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const domainChartData = Object.entries(domainData).map(
      ([domain, count]) => ({
        domain,
        count,
      }),
    );

    // Comment analytics
    const approvedComments = comments.filter((c) => c.approved);
    const pendingComments = comments.filter((c) => !c.approved);

    // Payment analytics
    const activePayments = paymentRecords.filter(
      (p) => p.status === PaymentStatus.active,
    );
    const pendingPayments = paymentRecords.filter(
      (p) => p.status === PaymentStatus.pending,
    );
    const expiredPayments = paymentRecords.filter(
      (p) => p.status === PaymentStatus.expired,
    );

    const totalRevenue = activePayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    // Question state distribution
    const questionStateData = [
      { name: "Published", value: publishedQuestions.length, color: "#22c55e" },
      { name: "Draft", value: draftQuestions.length, color: "#f59e0b" },
      { name: "Archived", value: archivedQuestions.length, color: "#6b7280" },
    ];

    // User activity analytics
    const totalLogins = userActivities.reduce(
      (sum, activity) => sum + Number(activity.loginCount),
      0,
    );
    const totalQuestionAttempts = userActivities.reduce(
      (sum, activity) => sum + Number(activity.questionAttempts),
      0,
    );
    const totalCommentCount = userActivities.reduce(
      (sum, activity) => sum + Number(activity.commentCount),
      0,
    );

    // User engagement levels
    const highEngagementUsers = userActivities.filter(
      (a) => Number(a.loginCount) >= 10,
    ).length;
    const mediumEngagementUsers = userActivities.filter(
      (a) => Number(a.loginCount) >= 3 && Number(a.loginCount) < 10,
    ).length;
    const lowEngagementUsers = userActivities.filter(
      (a) => Number(a.loginCount) < 3,
    ).length;

    const engagementData = [
      {
        name: "High (10+ logins)",
        value: highEngagementUsers,
        color: "#22c55e",
      },
      {
        name: "Medium (3-9 logins)",
        value: mediumEngagementUsers,
        color: "#f59e0b",
      },
      { name: "Low (<3 logins)", value: lowEngagementUsers, color: "#ef4444" },
    ];

    return {
      totalQuestions: questions.length,
      publishedQuestions: publishedQuestions.length,
      draftQuestions: draftQuestions.length,
      archivedQuestions: archivedQuestions.length,
      totalComments: comments.length,
      approvedComments: approvedComments.length,
      pendingComments: pendingComments.length,
      totalPayments: paymentRecords.length,
      activePayments: activePayments.length,
      pendingPayments: pendingPayments.length,
      expiredPayments: expiredPayments.length,
      totalRevenue,
      domainChartData,
      questionStateData,
      totalLogins,
      totalQuestionAttempts,
      totalCommentCount,
      engagementData,
      highEngagementUsers,
      mediumEngagementUsers,
      lowEngagementUsers,
    };
  }, [questions, comments, paymentRecords, userActivities]);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Questions
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.publishedQuestions} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats ? Number(userStats.totalUsers) : userActivities.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {userStats ? Number(userStats.newUsersLast7d) : 0} new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activePayments}</div>
            <p className="text-xs text-muted-foreground">
              ${(analytics.totalRevenue / 100).toFixed(2)} revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              User Engagement
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLogins}</div>
            <p className="text-xs text-muted-foreground">Total user logins</p>
          </CardContent>
        </Card>
      </div>

      {/* User Registration Stats */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Users (24h)
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Number(userStats.newUsersLast24h)}
              </div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Users (7d)
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {Number(userStats.newUsersLast7d)}
              </div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Users (30d)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {Number(userStats.newUsersLast30d)}
              </div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Questions by Domain</CardTitle>
            <CardDescription>
              Distribution of published questions across SMLE domains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Questions",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.domainChartData}>
                  <XAxis
                    dataKey="domain"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* User Engagement Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Engagement Levels</CardTitle>
            <CardDescription>
              Distribution of users by login frequency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                high: {
                  label: "High Engagement",
                  color: "#22c55e",
                },
                medium: {
                  label: "Medium Engagement",
                  color: "#f59e0b",
                },
                low: {
                  label: "Low Engagement",
                  color: "#ef4444",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.engagementData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {analytics.engagementData.map((entry) => (
                      <Cell
                        key={`cell-${entry.color}-${entry.name}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Question Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Published:</span>
              <span className="font-medium">
                {analytics.publishedQuestions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Draft:</span>
              <span className="font-medium">{analytics.draftQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Archived:</span>
              <span className="font-medium">{analytics.archivedQuestions}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Total Logins:
              </span>
              <span className="font-medium">{analytics.totalLogins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Question Attempts:
              </span>
              <span className="font-medium">
                {analytics.totalQuestionAttempts}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Comments Posted:
              </span>
              <span className="font-medium">{analytics.totalCommentCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Active:</span>
              <span className="font-medium text-green-600">
                {analytics.activePayments}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pending:</span>
              <span className="font-medium text-yellow-600">
                {analytics.pendingPayments}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Expired:</span>
              <span className="font-medium text-red-600">
                {analytics.expiredPayments}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Engagement Insights */}
      <Card>
        <CardHeader>
          <CardTitle>User Engagement Insights</CardTitle>
          <CardDescription>
            Detailed breakdown of user activity and engagement patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analytics.highEngagementUsers}
              </div>
              <div className="text-sm text-muted-foreground">
                High Engagement Users
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                10+ logins
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {analytics.mediumEngagementUsers}
              </div>
              <div className="text-sm text-muted-foreground">
                Medium Engagement Users
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                3-9 logins
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {analytics.lowEngagementUsers}
              </div>
              <div className="text-sm text-muted-foreground">
                Low Engagement Users
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                &lt;3 logins
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
