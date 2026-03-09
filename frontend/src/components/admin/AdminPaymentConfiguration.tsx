import { useState } from 'react';
import { useGetPaymentConfiguration, useUpdatePaymentConfiguration } from '../../hooks/useQueries';
import { useFileUpload, useFileUrl } from '../../blob-storage/FileStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Upload, Image, FileText, Settings, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';

export function AdminPaymentConfiguration() {
  const { data: paymentConfig } = useGetPaymentConfiguration();
  const updatePaymentConfig = useUpdatePaymentConfiguration();
  const { uploadFile, isUploading } = useFileUpload();
  const { data: currentBarcodeUrl } = useFileUrl(paymentConfig?.stcPayBarcodePath || '');

  const [localBankDetails, setLocalBankDetails] = useState(paymentConfig?.localBankDetails || '');
  const [selectedBarcodeFile, setSelectedBarcodeFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleBarcodeFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG)');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setSelectedBarcodeFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      let stcPayBarcodePath = paymentConfig?.stcPayBarcodePath || null;

      // Upload new barcode if selected
      if (selectedBarcodeFile) {
        const timestamp = Date.now();
        const fileExtension = selectedBarcodeFile.name.split('.').pop();
        const filePath = `payment-config/stc-barcode-${timestamp}.${fileExtension}`;

        const uploadResult = await uploadFile(filePath, selectedBarcodeFile);
        stcPayBarcodePath = uploadResult.path;
      }

      // Update payment configuration
      await updatePaymentConfig.mutateAsync({
        stcPayBarcodePath,
        localBankDetails: localBankDetails.trim() || null,
      });

      // Clean up
      setSelectedBarcodeFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      toast.success('Payment configuration updated successfully');
    } catch (error) {
      toast.error('Failed to update payment configuration');
      console.error('Payment configuration update error:', error);
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Payment Configuration</h2>
        <p className="text-muted-foreground">
          Configure payment methods that will be displayed to students
        </p>
      </div>

      {/* Current Configuration Status */}
      {paymentConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Configuration</CardTitle>
            <CardDescription>
              Last updated: {formatDate(paymentConfig.updatedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>STC Pay Barcode</Label>
                <div className="text-sm">
                  {paymentConfig.stcPayBarcodePath ? (
                    <span className="text-green-600">✓ Configured</span>
                  ) : (
                    <span className="text-muted-foreground">Not configured</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Local Bank Details</Label>
                <div className="text-sm">
                  {paymentConfig.localBankDetails ? (
                    <span className="text-green-600">✓ Configured</span>
                  ) : (
                    <span className="text-muted-foreground">Not configured</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STC Pay Barcode Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Image className="h-5 w-5" />
            <CardTitle>STC Pay Barcode</CardTitle>
          </div>
          <CardDescription>
            Upload a barcode image that students can scan with the STC Pay app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Barcode Display */}
          {currentBarcodeUrl && !selectedBarcodeFile && (
            <div className="space-y-2">
              <Label>Current Barcode</Label>
              <div className="border rounded-lg p-4 bg-muted/30">
                <img
                  src={currentBarcodeUrl}
                  alt="Current STC Pay barcode"
                  className="max-w-full h-auto max-h-64 mx-auto rounded"
                />
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload New Barcode</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleBarcodeFileSelect}
                className="hidden"
                id="barcode-upload"
              />
              <label htmlFor="barcode-upload" className="cursor-pointer">
                <div className="space-y-2">
                  {selectedBarcodeFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <Image className="h-8 w-8 text-primary" />
                        <span className="text-sm font-medium">{selectedBarcodeFile.name}</span>
                      </div>
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Barcode preview"
                          className="max-w-full h-auto max-h-32 mx-auto rounded border"
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG (max 5MB)
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Local Bank Transfer Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Local Bank Transfer Details</CardTitle>
          </div>
          <CardDescription>
            Enter bank account details for local bank transfers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bank Transfer Information</Label>
            <Textarea
              value={localBankDetails}
              onChange={(e) => setLocalBankDetails(e.target.value)}
              placeholder="Enter bank account details, including:
- Bank Name
- Account Number
- Account Holder Name
- IBAN (if applicable)
- Swift Code (if applicable)
- Any additional instructions"
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This information will be displayed to students when they select local bank transfer
            </p>
          </div>

          {/* Preview */}
          {localBankDetails.trim() && (
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </Label>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {localBankDetails.trim()}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveConfiguration}
          disabled={updatePaymentConfig.isPending || isUploading}
          size="lg"
        >
          {updatePaymentConfig.isPending || isUploading ? (
            <>
              <Settings className="h-4 w-4 mr-2 animate-spin" />
              {isUploading ? 'Uploading...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">
              Configuration Tips
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• STC Pay barcode should be clear and high-resolution for easy scanning</li>
              <li>• Include all necessary bank details for local transfers</li>
              <li>• Changes will be immediately visible to students on their payment page</li>
              <li>• Test the configuration by viewing the student payment page</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
