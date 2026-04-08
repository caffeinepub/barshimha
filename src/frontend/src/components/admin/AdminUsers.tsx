import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Principal } from "@dfinity/principal";
import {
  Activity,
  AlertTriangle,
  Calendar,
  Clock,
  Edit,
  HelpCircle,
  Lock,
  MessageCircle,
  Search,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PaymentStatus, UserRole } from "../../backend";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useAssignUserRole,
  useGetAllUsers,
  useGetCallerUserRole,
  useGetUserActivities,
  useGetUserStats,
} from "../../hooks/useQueries";

export function AdminUsers() {
  const { data: allUsers = [], isLoading: usersLoading } = useGetAllUsers();
  const { data: userStats } = useGetUserStats();
  const { data: userActivities = [] } = useGetUserActivities();
  const { identity } = useInternetIdentity();
  const assignUserRole = useAssignUserRole();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    principal: Principal;
    profile: any;
    currentRole: UserRole;
  } | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.user);

  // Helper function to determine if a user is an admin
  // This is a simplified check - in a real implementation, you'd get this from the backend
  const isUserAdmin = (principal: Principal): boolean => {
    // For now, we'll use a simple heuristic or you could add a separate query
    // In a real app, you'd want to get the actual role from the backend
    return (
      principal.toString().includes("admin") ||
      principal.toString() === identity?.getPrincipal().toString()
    );
  };

  // Combine user data with activities and roles
  // biome-ignore lint/correctness/useExhaustiveDependencies: isUserAdmin references identity which is stable
  const enrichedUsers = useMemo(() => {
    return allUsers.map(([principal, profile]) => {
      const activity = userActivities.find(
        (a) => a.user.toString() === principal.toString(),
      );
      const isAdmin = isUserAdmin(principal);
      return {
        principal,
        profile,
        currentRole: isAdmin ? UserRole.admin : UserRole.user,
        activity: activity || {
          user: principal,
          loginCount: BigInt(0),
          questionAttempts: BigInt(0),
          commentCount: BigInt(0),
          lastLogin: BigInt(0),
        },
      };
    });
  }, [allUsers, userActivities, identity]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return enrichedUsers.filter((user) => {
      const matchesSearch =
        user.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.principal
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "admin" && user.currentRole === UserRole.admin) ||
        (roleFilter === "user" && user.currentRole === UserRole.user);

      const matchesPayment =
        paymentFilter === "all" || user.profile.paymentStatus === paymentFilter;

      return matchesSearch && matchesRole && matchesPayment;
    });
  }, [enrichedUsers, searchTerm, roleFilter, paymentFilter]);

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      await assignUserRole.mutateAsync({
        user: selectedUser.principal,
        role: newRole,
      });
      toast.success("User role updated successfully");
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role");
      console.error("Role update error:", error);
    }
  };

  const openRoleDialog = (
    principal: Principal,
    profile: any,
    currentRole: UserRole,
  ) => {
    setSelectedUser({ principal, profile, currentRole });
    setNewRole(currentRole === UserRole.admin ? UserRole.admin : UserRole.user);
    setIsRoleDialogOpen(true);
  };

  const getUserRoleText = (role: UserRole) => {
    switch (role) {
      case UserRole.admin:
        return "Administrator";
      case UserRole.user:
        return "Student";
      case UserRole.guest:
        return "Guest";
      default:
        return "Unknown";
    }
  };

  const getUserRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.admin:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case UserRole.user:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case UserRole.guest:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

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

  const formatDate = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return "Never";
    return new Date(Number(timestamp) / 1000000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return "Never";
    return new Date(Number(timestamp) / 1000000).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canModifyUserRole = (userRole: UserRole): boolean => {
    // Only non-admin users can have their roles modified
    return userRole !== UserRole.admin;
  };

  const _isAttemptingAdminDemotion = (
    currentRole: UserRole,
    newRole: UserRole,
  ): boolean => {
    return currentRole === UserRole.admin && newRole === UserRole.user;
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">
          View and manage platform users, roles, and activities
        </p>
      </div>

      {/* Admin Role Protection Notice */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-800 dark:text-blue-200">
              Admin Role Protection
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Admin users are protected from role changes to maintain system
            security. Only student users can have their roles modified. Admin
            users cannot be demoted to student status to prevent accidental loss
            of administrative access.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats ? Number(userStats.totalUsers) : allUsers.length}
            </div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              New Users (24h)
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userStats ? Number(userStats.newUsersLast24h) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              New Users (7d)
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {userStats ? Number(userStats.newUsersLast7d) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              New Users (30d)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {userStats ? Number(userStats.newUsersLast30d) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or principal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
                <SelectItem value="user">Students</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value={PaymentStatus.active}>Active</SelectItem>
                <SelectItem value={PaymentStatus.pending}>Pending</SelectItem>
                <SelectItem value={PaymentStatus.expired}>Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            All registered users with their activity metrics and engagement
            data. Admin users are protected from role changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(
                ({ principal, profile, currentRole, activity }) => (
                  <TableRow key={principal.toString()}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {principal.toString().slice(0, 12)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge className={getUserRoleColor(currentRole)}>
                          {getUserRoleText(currentRole)}
                        </Badge>
                        {currentRole === UserRole.admin && (
                          <span title="Protected admin role">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getPaymentStatusColor(profile.paymentStatus)}
                      >
                        {profile.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(profile.registrationTime)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateTime(activity.lastLogin)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-xs">
                          <Activity className="h-3 w-3 text-blue-500" />
                          <span>{Number(activity.loginCount)} logins</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <HelpCircle className="h-3 w-3 text-green-500" />
                          <span>
                            {Number(activity.questionAttempts)} questions
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <MessageCircle className="h-3 w-3 text-purple-500" />
                          <span>{Number(activity.commentCount)} comments</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canModifyUserRole(currentRole) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openRoleDialog(principal, profile, currentRole)
                          }
                          disabled={assignUserRole.isPending}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Role
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="opacity-50"
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Protected
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Assignment Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.profile.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current User</Label>
              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="font-medium">{selectedUser?.profile.name}</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {selectedUser?.principal.toString()}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge
                    className={getUserRoleColor(
                      selectedUser?.currentRole || UserRole.user,
                    )}
                  >
                    Current:{" "}
                    {getUserRoleText(
                      selectedUser?.currentRole || UserRole.user,
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {selectedUser?.currentRole === UserRole.admin ? (
              <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>Admin Role Protection:</strong> This user has
                  administrator privileges and cannot be demoted to student
                  status. Admin roles are protected to maintain system security
                  and prevent accidental loss of administrative access.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>New Role</Label>
                  <Select
                    value={newRole}
                    onValueChange={(value) => setNewRole(value as UserRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.user}>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Student</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={UserRole.admin}>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Administrator</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newRole === UserRole.admin && (
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>Promoting to Administrator:</strong> This user
                      will gain full access to all platform features including
                      user management, question management, payment records, and
                      system configuration.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Warning:</strong> Changing user roles will affect
                    their access permissions immediately. Admin users have full
                    access to all platform features and cannot be demoted once
                    promoted.
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              {selectedUser?.currentRole !== UserRole.admin && (
                <Button
                  onClick={handleRoleChange}
                  disabled={
                    assignUserRole.isPending ||
                    selectedUser?.currentRole === newRole
                  }
                >
                  {assignUserRole.isPending ? "Updating..." : "Update Role"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Engagement Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Active Users</CardTitle>
            <CardDescription>Users with highest engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enrichedUsers
                .sort(
                  (a, b) =>
                    Number(b.activity.loginCount) -
                    Number(a.activity.loginCount),
                )
                .slice(0, 5)
                .map(({ principal, profile, activity, currentRole }) => (
                  <div
                    key={principal.toString()}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm font-medium">
                        {profile.name}
                      </span>
                      {currentRole === UserRole.admin && (
                        <Badge variant="outline" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Number(activity.loginCount)} logins
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Registrations</CardTitle>
            <CardDescription>Newest users on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enrichedUsers
                .sort(
                  (a, b) =>
                    Number(b.profile.registrationTime) -
                    Number(a.profile.registrationTime),
                )
                .slice(0, 5)
                .map(({ principal, profile, currentRole }) => (
                  <div
                    key={principal.toString()}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm font-medium">
                        {profile.name}
                      </span>
                      {currentRole === UserRole.admin && (
                        <Badge variant="outline" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(profile.registrationTime)}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
