import { useState, useEffect } from 'react';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetPaymentConfiguration, useGetPaymentRecords, useSubmitPaymentProof, useGetCallerUserRole } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useFileUpload, useFileUrl } from '../blob-storage/FileStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Calendar, CreditCard, Key, Upload, FileText, Image, CheckCircle, QrCode, Building, AlertCircle, Loader2, RefreshCw, Shield } from 'lucide-react';
import { PaymentStatus, PaymentMethod, PaymentRecord, UserRole } from '../backend';
import { toast } from 'sonner';

export function Profile() {
  const { data: userProfile, refetch: refetchProfile } = useGetCallerUserProfile();
  const { data: userRole } = useGetCallerUserRole();
  const { data: paymentConfig } = useGetPaymentConfiguration();
  const { data: paymentRecords = [], refetch: refetchPaymentRecords } = useGetPaymentRecords();
  const { identity } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();
  const submitPaymentProof = useSubmitPaymentProof();
  const { uploadFile, isUploading } = useFileUpload();
  const { data: stcBarcodeUrl } = useFileUrl(paymentConfig?.stcPayBarcodePath || '');

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.stcBank);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Find user's payment records
  const userPaymentRecords = paymentRecords.filter(record => 
    record.user.toString() === identity?.getPrincipal().toString()
  );

  const isStudent = userRole === UserRole.user;
  const isAdmin = userRole === UserRole.admin;

  // Real-time payment status monitoring
  useEffect(() => {
    if (userProfile?.paymentStatus === PaymentStatus.active) {
      // If payment status becomes active, show success message
      const hasActivePayment = userPaymentRecords.some(record => record.status === PaymentStatus.active);
      if (hasActivePayment) {
        toast.success('Payment approved! You now have full access to all features.');
      }
    }
  }, [userProfile?.paymentStatus, userPaymentRecords]);

  const handleEdit = () => {
    setName(userProfile?.name || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!userProfile || !name.trim()) {
      toast.error('Please enter a valid name');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        ...userProfile,
        name: name.trim(),
      });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    }
  };

  const handleCancel = () => {
    setName('');
    setIsEditing(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Reset previous states
      setUploadError(null);
      setUploadSuccess(false);
      setUploadProgress(0);

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        const error = 'Please select a valid image (JPEG, PNG) or PDF file';
        setUploadError(error);
        toast.error(error);
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        const error = 'File size must be less than 10MB';
        setUploadError(error);
        toast.error(error);
        return;
      }

      setSelectedFile(file);
    }
  };

  const handlePaymentSubmission = async () => {
    if (!selectedFile || !userProfile || !identity) {
      const error = 'Please select a payment proof file';
      setUploadError(error);
      toast.error(error);
      return;
    }

    if (!isStudent) {
      const error = 'Only students can upload payment proof';
      setUploadError(error);
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split('.').pop();
      const principalId = identity.getPrincipal().toString();
      const filePath = `payment-proofs/${principalId}_${timestamp}.${fileExtension}`;

      // Upload file to blob storage first with progress tracking
      let uploadResult;
      try {
        setUploadProgress(25);
        uploadResult = await uploadFile(filePath, selectedFile, (progress) => {
          // Update progress based on upload progress
          setUploadProgress(25 + (progress * 0.5)); // 25% to 75%
        });
        setUploadProgress(75);
      } catch (uploadError: any) {
        throw new Error(`File upload failed: ${uploadError.message || 'Unable to upload file to storage'}`);
      }

      // Verify file was uploaded successfully
      if (!uploadResult || !uploadResult.path) {
        throw new Error('File upload completed but no file path was returned. Please try again.');
      }

      setUploadProgress(85);

      // Submit payment proof using the simplified approach - backend handles record creation
      try {
        await submitPaymentProof.mutateAsync({
          filePath: uploadResult.path,
          fileType: selectedFile.type,
        });
        setUploadProgress(95);
      } catch (submitError: any) {
        throw new Error(submitError.message || 'Unable to submit payment proof');
      }

      // Update user profile status to pending if not already
      if (userProfile.paymentStatus !== PaymentStatus.pending && userProfile.paymentStatus !== PaymentStatus.active) {
        try {
          const updatedProfile = {
            ...userProfile,
            paymentStatus: PaymentStatus.pending,
          };
          await saveProfile.mutateAsync(updatedProfile);
        } catch (profileError) {
          // Don't fail the entire process if profile update fails
          console.warn('Profile status update failed, but payment proof was uploaded successfully');
        }
      }

      // Force refresh of data to ensure synchronization
      try {
        await Promise.all([
          refetchProfile(),
          refetchPaymentRecords(),
        ]);
      } catch (refreshError) {
        console.warn('Data refresh failed, but upload was successful');
      }

      // Mark as successful
      setUploadProgress(100);
      setUploadSuccess(true);
      
      // Clean up
      setIsPaymentDialogOpen(false);
      setSelectedFile(null);
      
      toast.success('Payment proof uploaded successfully! Your payment is now under review.');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload payment proof. Please try again.';
      setUploadError(errorMessage);
      toast.error(errorMessage);
      console.error('Payment proof upload error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetUploadState = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.active:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case PaymentStatus.pending:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case PaymentStatus.expired:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPaymentStatusText = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.active:
        return 'Active Subscription';
      case PaymentStatus.pending:
        return 'Payment Pending';
      case PaymentStatus.expired:
        return 'Subscription Expired';
      default:
        return 'Unknown Status';
    }
  };

  const getUserRoleText = (role: UserRole) => {
    switch (role) {
      case UserRole.admin:
        return 'Administrator';
      case UserRole.user:
        return 'Student';
      case UserRole.guest:
        return 'Guest';
      default:
        return 'Unknown';
    }
  };

  const getUserRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.admin:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case UserRole.user:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case UserRole.guest:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check if user has any pending payment records with proofs
  const hasPendingPaymentProof = userPaymentRecords.some(record => 
    record.status === PaymentStatus.pending && record.proof
  );

  // Check if user has active payment status
  const hasActivePayment = userProfile.paymentStatus === PaymentStatus.active;

  const isProcessingPayment = isUploading || submitPaymentProof.isPending || isSubmitting;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information and subscription status
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <CardTitle>Profile Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            {isEditing ? (
              <div className="flex space-x-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
                <Button onClick={handleSave} disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{userProfile.name}</p>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  Edit
                </Button>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>User Role</Label>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge className={getUserRoleColor(userRole || UserRole.guest)}>
                {getUserRoleText(userRole || UserRole.guest)}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Registration Date</Label>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">{formatDate(userProfile.registrationTime)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <CardTitle>Account Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Principal ID</Label>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-mono break-all">
                {identity?.getPrincipal().toString()}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              This is your unique identifier on the Internet Computer network.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status - Only show for students */}
      {isStudent && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Subscription Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Status</p>
                <p className="text-sm text-muted-foreground">
                  Your subscription determines access to study materials
                </p>
              </div>
              <Badge className={getPaymentStatusColor(userProfile.paymentStatus)}>
                {getPaymentStatusText(userProfile.paymentStatus)}
              </Badge>
            </div>

            {/* Payment Records Status - Only show if not active */}
            {!hasActivePayment && userPaymentRecords.length > 0 && (
              <div className="space-y-3">
                <Label>Your Payment Records</Label>
                {userPaymentRecords.map((record) => (
                  <div key={record.id} className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">
                          Payment Record #{record.id.slice(-8)}
                        </p>
                      </div>
                      <Badge className={getPaymentStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Method: {record.method === PaymentMethod.stcBank ? 'STC Bank' : 'Local Bank'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {formatDate(record.createdAt)}
                    </p>
                    {record.proof && record.status === PaymentStatus.pending && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        ✓ Payment proof uploaded and under review
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Payment Methods */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Available Payment Methods</h4>
                <div className="grid grid-cols-1 gap-4">
                  {/* STC Bank Transfer */}
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <QrCode className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">STC Bank Transfer</CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        Transfer using STC Bank with barcode scanning
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {paymentConfig?.stcPayBarcodePath && stcBarcodeUrl ? (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground">
                            Scan this barcode with the STC Pay app to complete your payment
                          </p>
                          <div className="bg-white p-4 rounded-lg border inline-block">
                            <img
                              src={stcBarcodeUrl}
                              alt="STC Pay barcode"
                              className="max-w-full h-auto max-h-32"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          STC Pay barcode not configured. Please contact support.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Local Bank Transfer */}
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <Building className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Local Bank Transfer</CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        Traditional bank transfer method
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {paymentConfig?.localBankDetails ? (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground mb-2">
                            Transfer to the following bank account:
                          </p>
                          <div className="bg-muted/30 p-3 rounded border">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                              {paymentConfig.localBankDetails}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Local bank details not configured. Please contact support.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {!hasActivePayment && (
                <div className="space-y-3">
                  <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
                    setIsPaymentDialogOpen(open);
                    if (!open) {
                      resetUploadState();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full" disabled={isProcessingPayment || !isStudent}>
                        <Upload className="h-4 w-4 mr-2" />
                        {isProcessingPayment ? 'Processing...' : 'Upload Payment Proof'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Upload Payment Proof</DialogTitle>
                        <DialogDescription>
                          Select your payment method and upload proof of payment
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Authentication Status */}
                        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <p className="text-sm text-green-800 dark:text-green-200">
                              Authenticated as: {getUserRoleText(userRole || UserRole.guest)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label>Payment Method</Label>
                          <RadioGroup
                            value={selectedPaymentMethod}
                            onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethod)}
                            disabled={isProcessingPayment}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={PaymentMethod.stcBank} id="stc" />
                              <Label htmlFor="stc">STC Bank Transfer</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={PaymentMethod.localBank} id="local" />
                              <Label htmlFor="local">Local Bank Transfer</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-3">
                          <Label>Upload Payment Receipt</Label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleFileSelect}
                              className="hidden"
                              id="file-upload"
                              disabled={isProcessingPayment}
                            />
                            <label htmlFor="file-upload" className={`cursor-pointer ${isProcessingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <div className="space-y-2">
                                {selectedFile ? (
                                  <div className="flex items-center justify-center space-x-2">
                                    {selectedFile.type.startsWith('image/') ? (
                                      <Image className="h-8 w-8 text-primary" />
                                    ) : (
                                      <FileText className="h-8 w-8 text-primary" />
                                    )}
                                    <span className="text-sm font-medium">{selectedFile.name}</span>
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                                    <p className="text-sm text-muted-foreground">
                                      Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      PNG, JPG or PDF (max 10MB)
                                    </p>
                                  </>
                                )}
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Upload Progress */}
                        {isProcessingPayment && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Upload Progress</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="w-full" />
                          </div>
                        )}

                        {/* Error Display */}
                        {uploadError && (
                          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800 dark:text-red-200">
                              {uploadError}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Success Display */}
                        {uploadSuccess && (
                          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800 dark:text-green-200">
                              Payment proof uploaded successfully! Your payment is now under review.
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Processing Status */}
                        {isProcessingPayment && (
                          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                {isUploading ? 'Uploading file...' : 
                                 submitPaymentProof.isPending ? 'Submitting payment proof...' : 
                                 'Processing...'}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsPaymentDialogOpen(false);
                              resetUploadState();
                            }}
                            disabled={isProcessingPayment}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handlePaymentSubmission}
                            disabled={!selectedFile || isProcessingPayment || uploadSuccess || !isStudent}
                          >
                            {isProcessingPayment ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : uploadSuccess ? (
                              'Upload Complete'
                            ) : (
                              'Submit Payment Proof'
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {hasPendingPaymentProof
                          ? 'Your payment proof has been submitted and is being processed. You will gain access to all features once payment is confirmed.'
                          : userProfile.paymentStatus === PaymentStatus.pending
                          ? 'Your payment is being processed. You will gain access to all features once payment is confirmed.'
                          : 'Your subscription has expired. Please upload payment proof to renew your subscription.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {hasActivePayment && (
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Your subscription is active! You have full access to all study materials and features.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Notice */}
      {isAdmin && (
        <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-800 dark:text-purple-200">Administrator Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-purple-700 dark:text-purple-300">
              You have administrator privileges. You can manage questions, users, and payment records through the Admin Panel.
              Administrators do not need to upload payment proofs as they have full access to all features.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Manage your account settings and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            Download My Data
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Export Study Progress
          </Button>
          <Separator />
          <Button variant="destructive" className="w-full justify-start">
            Delete Account
          </Button>
          <p className="text-xs text-muted-foreground">
            Account deletion is permanent and cannot be undone.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
