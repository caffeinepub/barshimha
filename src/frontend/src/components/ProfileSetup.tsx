import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, User } from "lucide-react";
import { useState } from "react";
import { PaymentStatus, type UserProfile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

export function ProfileSetup() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { identity } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!identity) {
      setError("Authentication required");
      return;
    }

    try {
      const profile: UserProfile = {
        name: name.trim(),
        registrationTime: BigInt(Date.now() * 1000000), // Convert to nanoseconds
        paymentStatus: PaymentStatus.pending,
        paymentProof: undefined,
      };

      await saveProfile.mutateAsync(profile);
    } catch (err: any) {
      console.error("Profile setup error:", err);
      setError(err.message || "Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Barshimha!</CardTitle>
          <CardDescription>
            Please tell us your name to complete your registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saveProfile.isPending}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={saveProfile.isPending || !name.trim()}
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up your profile...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Your information is secure and will only be used for your account
              management.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
