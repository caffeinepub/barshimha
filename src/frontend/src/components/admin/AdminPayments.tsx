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
import { Principal } from "@dfinity/principal";
import {
  AlertCircle,
  Check,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  Image,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PaymentMethod,
  type PaymentProof,
  type PaymentRecord,
  PaymentStatus,
} from "../../backend";
import { useFileUrl } from "../../blob-storage/FileStorage";
import {
  useAddPaymentRecord,
  useApprovePayment,
  useGetPaymentRecords,
  useUpdatePaymentRecord,
} from "../../hooks/useQueries";

interface PaymentProofViewerProps {
  proof: PaymentProof | null;
}

function PaymentProofViewer({ proof }: PaymentProofViewerProps) {
  const { data: fileUrl, isLoading } = useFileUrl(proof?.filePath || "");

  if (!proof) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          No payment proof available
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">
          Loading payment proof...
        </p>
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-destructive">Failed to load payment proof</p>
      </div>
    );
  }

  const isImage = proof.fileType.startsWith("image/");

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        {isImage ? (
          <Image className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          Payment Proof ({proof.fileType})
        </span>
      </div>

      {isImage ? (
        <img
          src={fileUrl}
          alt="Payment proof"
          className="max-w-full h-auto rounded-lg border"
          style={{ maxHeight: "400px" }}
        />
      ) : (
        <div className="border rounded-lg p-4 text-center">
          <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">PDF Document</p>
          <Button asChild size="sm">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              View PDF
            </a>
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Uploaded:{" "}
        {new Date(Number(proof.uploadedAt) / 1000000).toLocaleString()}
      </p>
    </div>
  );
}

export function AdminPayments() {
  const {
    data: paymentRecords = [],
    refetch: refetchPaymentRecords,
    isLoading: isLoadingRecords,
  } = useGetPaymentRecords();
  const addPaymentRecord = useAddPaymentRecord();
  const updatePaymentRecord = useUpdatePaymentRecord();
  const approvePayment = useApprovePayment();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(
    null,
  );
  const [viewingProof, setViewingProof] = useState<PaymentProof | null>(null);
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const [formData, setFormData] = useState({
    userPrincipal: "",
    amount: "",
    method: PaymentMethod.stcBank,
    status: PaymentStatus.pending,
  });

  // Enhanced auto-refresh with better synchronization
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refetchPaymentRecords();
        setLastRefresh(new Date());
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [refetchPaymentRecords]);

  const filteredPayments = paymentRecords.filter((payment) => {
    const matchesSearch =
      payment.user
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      userPrincipal: "",
      amount: "",
      method: PaymentMethod.stcBank,
      status: PaymentStatus.pending,
    });
    setEditingPayment(null);
  };

  const handleEdit = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setFormData({
      userPrincipal: payment.user.toString(),
      amount: (Number(payment.amount) / 100).toString(),
      method: payment.method,
      status: payment.status,
    });
    setIsDialogOpen(true);
  };

  const handleViewProof = (proof: PaymentProof) => {
    setViewingProof(proof);
    setIsProofDialogOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchPaymentRecords();
      setLastRefresh(new Date());
      toast.success("Payment records refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh payment records");
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApprovePayment = async (paymentRecordId: string) => {
    try {
      await approvePayment.mutateAsync(paymentRecordId);
      toast.success(
        "Payment approved successfully! Student payment status has been updated to active and they now have full access to all features.",
      );

      // Force refresh to ensure immediate updates
      await refetchPaymentRecords();
      setLastRefresh(new Date());
    } catch (error) {
      toast.error("Failed to approve payment");
      console.error("Payment approval error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userPrincipal.trim() || !formData.amount.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const principal = Principal.fromText(formData.userPrincipal.trim());
      const amountInCents = Math.round(
        Number.parseFloat(formData.amount) * 100,
      );

      const paymentData: PaymentRecord = {
        id:
          editingPayment?.id ||
          `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user: principal,
        amount: BigInt(amountInCents),
        method: formData.method,
        status: formData.status,
        createdAt: editingPayment?.createdAt || BigInt(Date.now() * 1000000),
        updatedAt: BigInt(Date.now() * 1000000),
        proof: editingPayment?.proof, // Preserve existing proof
      };

      if (editingPayment) {
        await updatePaymentRecord.mutateAsync(paymentData);
        toast.success("Payment record updated successfully");
      } else {
        await addPaymentRecord.mutateAsync(paymentData);
        toast.success("Payment record created successfully");
      }

      setIsDialogOpen(false);
      resetForm();

      // Force refresh to ensure synchronization
      await refetchPaymentRecords();
      setLastRefresh(new Date());
    } catch (error) {
      toast.error("Failed to save payment record");
      console.error("Payment save error:", error);
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
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

  const getMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.stcBank:
        return "STC Bank";
      case PaymentMethod.localBank:
        return "Local Bank";
      default:
        return "Unknown";
    }
  };

  const totalRevenue = paymentRecords
    .filter((p) => p.status === PaymentStatus.active)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const activePayments = paymentRecords.filter(
    (p) => p.status === PaymentStatus.active,
  );
  const pendingPayments = paymentRecords.filter(
    (p) => p.status === PaymentStatus.pending,
  );
  const recordsWithProofs = paymentRecords.filter((p) => p.proof);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Management</h2>
          <p className="text-muted-foreground">
            Manage student payments and subscriptions with real-time approval
            system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingRecords}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPayment
                    ? "Edit Payment Record"
                    : "Create Payment Record"}
                </DialogTitle>
                <DialogDescription>
                  {editingPayment
                    ? "Update the payment details below."
                    : "Fill in the payment details."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>User Principal *</Label>
                  <Input
                    value={formData.userPrincipal}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        userPrincipal: e.target.value,
                      }))
                    }
                    placeholder="Enter user principal ID"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Amount (USD) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        method: value as PaymentMethod,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentMethod.stcBank}>
                        STC Bank
                      </SelectItem>
                      <SelectItem value={PaymentMethod.localBank}>
                        Local Bank
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: value as PaymentStatus,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentStatus.pending}>
                        Pending
                      </SelectItem>
                      <SelectItem value={PaymentStatus.active}>
                        Active
                      </SelectItem>
                      <SelectItem value={PaymentStatus.expired}>
                        Expired
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      addPaymentRecord.isPending ||
                      updatePaymentRecord.isPending
                    }
                  >
                    {addPaymentRecord.isPending || updatePaymentRecord.isPending
                      ? "Saving..."
                      : editingPayment
                        ? "Update Payment"
                        : "Create Payment"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalRevenue / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From active payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activePayments.length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingPayments.length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Payment Proofs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {recordsWithProofs.length}
            </div>
            <p className="text-xs text-muted-foreground">Uploaded proofs</p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Sync Status */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Real-time synchronization active - Payment approvals immediately
                update student access across all interfaces
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
              <Clock className="h-3 w-3" />
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={PaymentStatus.active}>Active</SelectItem>
                <SelectItem value={PaymentStatus.pending}>Pending</SelectItem>
                <SelectItem value={PaymentStatus.expired}>Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records ({filteredPayments.length})</CardTitle>
          <CardDescription>
            All payment records with real-time approval system - approving
            payments immediately grants student access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="ml-2 text-muted-foreground">
                Loading payment records...
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {payment.id.slice(0, 12)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {payment.user.toString().slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ${(Number(payment.amount) / 100).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getMethodLabel(payment.method)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.proof ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewProof(payment.proof!)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">
                              Uploaded
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No proof
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(
                          Number(payment.createdAt) / 1000000,
                        ).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(
                          Number(payment.updatedAt) / 1000000,
                        ).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {payment.status === PaymentStatus.pending &&
                          payment.proof && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprovePayment(payment.id)}
                              disabled={approvePayment.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {approvePayment.isPending
                                ? "Approving..."
                                : "Approve"}
                            </Button>
                          )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(payment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Proof Viewer Dialog */}
      <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>
              Review the uploaded payment proof document
            </DialogDescription>
          </DialogHeader>
          <PaymentProofViewer proof={viewingProof} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
