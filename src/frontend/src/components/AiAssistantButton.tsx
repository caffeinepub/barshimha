import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { useState } from "react";
import { useIsAiAssistantEnabled } from "../hooks/useQueries";
import { AiAssistant } from "./AiAssistant";

interface AiAssistantButtonProps {
  questionContext?: string;
}

export function AiAssistantButton({ questionContext }: AiAssistantButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: isEnabled, isLoading } = useIsAiAssistantEnabled();

  if (isLoading || !isEnabled) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        size="icon"
        title="AI Study Assistant"
      >
        <Bot className="h-6 w-6" />
      </Button>
      <AiAssistant
        open={isOpen}
        onOpenChange={setIsOpen}
        questionContext={questionContext}
      />
    </>
  );
}
