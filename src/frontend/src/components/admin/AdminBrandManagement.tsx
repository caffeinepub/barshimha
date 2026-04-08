import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  Image,
  Loader2,
  Music,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useFileUpload, useFileUrl } from "../../blob-storage/FileStorage";
import {
  useGetBrandAssets,
  useUpdateBrandAssets,
} from "../../hooks/useQueries";

export function AdminBrandManagement() {
  const { data: brandAssets, refetch: refetchBrandAssets } =
    useGetBrandAssets();
  const updateBrandAssets = useUpdateBrandAssets();
  const { uploadFile, isUploading } = useFileUpload();
  const { data: currentLogoUrl, refetch: refetchLogoUrl } = useFileUrl(
    brandAssets?.logoPath || "",
  );
  const { data: currentSoundUrl, refetch: refetchSoundUrl } = useFileUrl(
    brandAssets?.soundPath || "",
  );

  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedSoundFile, setSelectedSoundFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  // Aggressive auto-refresh for immediate asset updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refetchBrandAssets();
        if (brandAssets?.logoPath) {
          await refetchLogoUrl();
        }
        if (brandAssets?.soundPath) {
          await refetchSoundUrl();
        }
      } catch (error) {
        console.warn("Brand management asset refresh failed:", error);
      }
    }, 2000); // Check every 2 seconds for immediate updates

    return () => clearInterval(interval);
  }, [refetchBrandAssets, refetchLogoUrl, refetchSoundUrl, brandAssets]);

  const validateLogoFile = (file: File): string | null => {
    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/svg+xml",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return "Please select a valid image file (JPEG, PNG, SVG, WebP)";
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return "Logo file size must be less than 5MB";
    }

    return null;
  };

  const validateSoundFile = (file: File): string | null => {
    // Validate file type
    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/m4a",
      "audio/aac",
    ];
    if (!allowedTypes.includes(file.type)) {
      return "Please select a valid audio file (MP3, WAV, OGG, M4A, AAC)";
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return "Sound file size must be less than 10MB";
    }

    return null;
  };

  const handleLogoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateLogoFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedLogoFile(file);

    // Clean up previous preview URL
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    // Create new preview URL
    const url = URL.createObjectURL(file);
    setLogoPreviewUrl(url);

    toast.success(`Logo file selected: ${file.name}`);
  };

  const handleSoundFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateSoundFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedSoundFile(file);
    toast.success(`Sound file selected: ${file.name}`);
  };

  const clearLogoSelection = () => {
    setSelectedLogoFile(null);
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(null);
    }
  };

  const clearSoundSelection = () => {
    setSelectedSoundFile(null);
  };

  const handleSaveBrandAssets = async () => {
    if (!selectedLogoFile && !selectedSoundFile) {
      toast.error("Please select at least one file to upload");
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setUploadStatus("Preparing upload...");

    try {
      let logoPath = brandAssets?.logoPath || null;
      let soundPath = brandAssets?.soundPath || null;

      // Upload new logo if selected
      if (selectedLogoFile) {
        setUploadStatus("Uploading logo...");
        setUploadProgress(10);

        const timestamp = Date.now();
        const fileExtension = selectedLogoFile.name.split(".").pop();
        const filePath = `brand-assets/logo-${timestamp}.${fileExtension}`;

        try {
          const uploadResult = await uploadFile(
            filePath,
            selectedLogoFile,
            (progress) => {
              setUploadProgress(10 + progress * 0.4); // 10% to 50%
            },
          );

          if (!uploadResult || !uploadResult.path) {
            throw new Error("Logo upload failed - no file path returned");
          }

          logoPath = uploadResult.path;
          setUploadProgress(50);
          setUploadStatus("Logo uploaded successfully");
        } catch (uploadError: any) {
          throw new Error(
            `Logo upload failed: ${uploadError.message || "Unknown error"}`,
          );
        }
      }

      // Upload new sound file if selected
      if (selectedSoundFile) {
        setUploadStatus("Uploading sound file...");
        setUploadProgress(selectedLogoFile ? 50 : 10);

        const timestamp = Date.now();
        const fileExtension = selectedSoundFile.name.split(".").pop();
        const filePath = `brand-assets/sound-${timestamp}.${fileExtension}`;

        try {
          const uploadResult = await uploadFile(
            filePath,
            selectedSoundFile,
            (progress) => {
              const baseProgress = selectedLogoFile ? 50 : 10;
              setUploadProgress(baseProgress + progress * 0.3); // 30% for sound upload
            },
          );

          if (!uploadResult || !uploadResult.path) {
            throw new Error("Sound upload failed - no file path returned");
          }

          soundPath = uploadResult.path;
          setUploadProgress(selectedLogoFile ? 80 : 70);
          setUploadStatus("Sound file uploaded successfully");
        } catch (uploadError: any) {
          throw new Error(
            `Sound upload failed: ${uploadError.message || "Unknown error"}`,
          );
        }
      }

      // Update brand assets in backend
      setUploadStatus("Updating brand assets...");
      setUploadProgress(90);

      await updateBrandAssets.mutateAsync({
        logoPath,
        soundPath,
      });

      setUploadProgress(95);
      setUploadStatus("Deploying assets...");

      // Force aggressive refresh of brand assets and URLs
      await refetchBrandAssets();
      if (logoPath) {
        await refetchLogoUrl();
      }
      if (soundPath) {
        await refetchSoundUrl();
      }

      // Additional refresh after a short delay to ensure propagation
      setTimeout(async () => {
        await refetchBrandAssets();
        if (logoPath) {
          await refetchLogoUrl();
        }
        if (soundPath) {
          await refetchSoundUrl();
        }
      }, 1000);

      setUploadProgress(100);
      setUploadStatus("Brand assets deployed successfully!");

      // Clean up
      setSelectedLogoFile(null);
      setSelectedSoundFile(null);
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
        setLogoPreviewUrl(null);
      }

      toast.success(
        "Brand assets updated and deployed successfully! Changes are now live across the entire system.",
      );
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update brand assets";
      setUploadStatus(`Error: ${errorMessage}`);
      toast.error(errorMessage);
      console.error("Brand assets update error:", error);
    } finally {
      setIsProcessing(false);
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus("");
      }, 3000);
    }
  };

  const handleRefreshAssets = async () => {
    try {
      await refetchBrandAssets();
      if (brandAssets?.logoPath) {
        await refetchLogoUrl();
      }
      if (brandAssets?.soundPath) {
        await refetchSoundUrl();
      }
      toast.success("Brand assets refreshed");
    } catch (_error) {
      toast.error("Failed to refresh brand assets");
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const hasChanges = selectedLogoFile || selectedSoundFile;

  // Create cache-busted URLs for immediate display
  const cacheBustedLogoUrl = currentLogoUrl
    ? `${currentLogoUrl}?t=${Date.now()}`
    : null;
  const cacheBustedSoundUrl = currentSoundUrl
    ? `${currentSoundUrl}?t=${Date.now()}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Brand Management</h2>
          <p className="text-muted-foreground">
            Upload and manage your platform's logo and landing page sound file
            with instant deployment
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefreshAssets}
          disabled={isProcessing}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Brand Assets Status */}
      {brandAssets && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Brand Assets</CardTitle>
            <CardDescription>
              Last updated: {formatDate(brandAssets.updatedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Logo Image</Label>
                <div className="space-y-2">
                  {brandAssets.logoPath ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">
                          Configured and active
                        </span>
                      </div>
                      {cacheBustedLogoUrl && (
                        <div className="border rounded-lg p-3 bg-muted/30">
                          <img
                            src={cacheBustedLogoUrl}
                            alt="Current logo"
                            className="max-w-full h-auto max-h-20 mx-auto rounded"
                            onError={() =>
                              toast.error("Failed to load current logo")
                            }
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Not configured
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Sound File</Label>
                <div className="space-y-2">
                  {brandAssets.soundPath ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">
                          Configured and active
                        </span>
                      </div>
                      {cacheBustedSoundUrl && (
                        <div className="border rounded-lg p-3 bg-muted/30">
                          <audio controls className="w-full max-w-xs">
                            <source src={cacheBustedSoundUrl} />
                            <track kind="captions" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Not configured
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Deployment Notice */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Instant Deployment:</strong> Brand asset changes are deployed
          immediately across all pages and interfaces. The logo will appear
          system-wide instantly, and the sound file will be immediately
          available on the landing page with enhanced reliability.
        </AlertDescription>
      </Alert>

      {/* Upload Progress */}
      {isProcessing && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Upload Progress</span>
                <span className="text-sm text-muted-foreground">
                  {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              {uploadStatus && (
                <p className="text-sm text-muted-foreground">{uploadStatus}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logo Upload Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Image className="h-5 w-5" />
            <CardTitle>Logo Image</CardTitle>
          </div>
          <CardDescription>
            Upload a logo image that will be displayed across all pages and
            interfaces with instant deployment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo File Upload */}
          <div className="space-y-3">
            <Label>Upload New Logo</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoFileSelect}
                className="hidden"
                id="logo-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="logo-upload"
                className={`cursor-pointer ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="space-y-3">
                  {selectedLogoFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-2">
                        <Image className="h-8 w-8 text-primary" />
                        <div className="text-center">
                          <span className="text-sm font-medium block">
                            {selectedLogoFile.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(selectedLogoFile.size)}
                          </span>
                        </div>
                      </div>
                      {logoPreviewUrl && (
                        <div className="space-y-2">
                          <img
                            src={logoPreviewUrl}
                            alt="Logo preview"
                            className="max-w-full h-auto max-h-32 mx-auto rounded border"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearLogoSelection}
                            disabled={isProcessing}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, SVG, WebP (max 5MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sound File Upload Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Music className="h-5 w-5" />
            <CardTitle>Landing Page Sound</CardTitle>
          </div>
          <CardDescription>
            Upload a sound file that will be available on the landing page with
            enhanced audio controls and reliability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sound File Upload */}
          <div className="space-y-3">
            <Label>Upload New Sound File</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="audio/*"
                onChange={handleSoundFileSelect}
                className="hidden"
                id="sound-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="sound-upload"
                className={`cursor-pointer ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="space-y-3">
                  {selectedSoundFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-2">
                        <Music className="h-8 w-8 text-primary" />
                        <div className="text-center">
                          <span className="text-sm font-medium block">
                            {selectedSoundFile.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(selectedSoundFile.size)}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearSoundSelection}
                        disabled={isProcessing}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          MP3, WAV, OGG, M4A, AAC (max 10MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => {
            clearLogoSelection();
            clearSoundSelection();
          }}
          disabled={!hasChanges || isProcessing}
        >
          Clear All
        </Button>
        <Button
          onClick={handleSaveBrandAssets}
          disabled={!hasChanges || isProcessing || isUploading}
          size="lg"
          className="min-w-[200px]"
        >
          {isProcessing || isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isUploading ? "Uploading..." : "Processing..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Deploy Brand Assets
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h4 className="font-medium text-green-800 dark:text-green-200 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Enhanced Brand Asset Guidelines</span>
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>
                • <strong>Logo:</strong> Clear and readable at different sizes,
                supports PNG (with transparency), SVG (scalable), JPG, and WebP
                formats
              </li>
              <li>
                • <strong>Sound:</strong> High-quality audio with enhanced
                player controls including play/pause, volume, and progress
                tracking
              </li>
              <li>
                • <strong>Instant Deployment:</strong> Changes are deployed
                immediately across all system interfaces with real-time updates
              </li>
              <li>
                • <strong>Reliability:</strong> Enhanced error handling and
                fallback mechanisms ensure consistent user experience
              </li>
              <li>
                • <strong>File Validation:</strong> Comprehensive validation
                ensures only compatible, high-quality files are uploaded
              </li>
              <li>
                • <strong>Progress Tracking:</strong> Real-time upload progress
                and status updates keep you informed throughout the process
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
