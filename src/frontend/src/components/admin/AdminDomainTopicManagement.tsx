import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

/**
 * Domain management is now handled via the question bank structure.
 * The five SMLE domains (Surgery, OBGYN, Internal Medicine, Pediatrics, Ethics)
 * are fixed in the backend and cannot be added, renamed, or deleted.
 * Questions are organised by domain only — subjects and topics have been removed.
 */
export function AdminDomainTopicManagement() {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Domain management is now handled via the question bank structure. The
          five SMLE domains —{" "}
          <strong>Surgery, OBGYN, Internal Medicine, Pediatrics, Ethics</strong>{" "}
          — are fixed in the backend. Questions are organised by domain only.
          Subjects and topics have been removed.
        </AlertDescription>
      </Alert>
    </div>
  );
}
