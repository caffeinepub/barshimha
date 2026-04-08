import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { PaymentStatus } from "../backend";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

export function ProfileSetupModal() {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        registrationTime: BigInt(Date.now() * 1000000), // Convert to nanoseconds
        paymentStatus: PaymentStatus.pending,
      });
      toast.success(
        "Welcome to Barshimha! Your profile has been created successfully.",
      );
    } catch (error) {
      toast.error("Failed to create profile. Please try again.");
      console.error("Profile creation error:", error);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome to Barshimha!</DialogTitle>
          <DialogDescription>
            Please enter your name to complete your profile setup and start your
            SMLE preparation journey.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={saveProfile.isPending}
          >
            {saveProfile.isPending
              ? "Creating Profile..."
              : "Complete Setup & Start Learning"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
