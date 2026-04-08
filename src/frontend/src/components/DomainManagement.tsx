import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

/**
 * Domain management is now handled via the question bank structure.
 * The five SMLE domains are fixed; subjects and topics have been removed.
 */
export function DomainManagement() {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Domain management is now handled via the question bank structure. The
          five SMLE domains —{" "}
          <strong>Surgery, OBGYN, Internal Medicine, Pediatrics, Ethics</strong>{" "}
          — are fixed in the backend. Subjects and topics have been removed.
        </AlertDescription>
      </Alert>
    </div>
  );
}
