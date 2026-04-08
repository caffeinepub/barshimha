import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bot, Loader2, Send, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useIsAiAssistantEnabled, useSendAiMessage } from "../hooks/useQueries";

interface Message {
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: number;
}

interface AiAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionContext?: string;
}

export function AiAssistant({
  open,
  onOpenChange,
  questionContext,
}: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);

  const { data: isEnabled, isLoading: isCheckingEnabled } =
    useIsAiAssistantEnabled();
  const sendMessage = useSendAiMessage();

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  // Focus input and handle iOS viewport when modal opens
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, [open]);

  // iOS visual viewport handling — shrink panel when keyboard appears
  useEffect(() => {
    if (!open || !isIOS) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      if (!panelRef.current) return;
      const vvHeight = vv.height;
      const vvOffsetTop = vv.offsetTop;
      // Position panel to fit within the visual viewport
      panelRef.current.style.height = `${vvHeight}px`;
      panelRef.current.style.top = `${vvOffsetTop}px`;
    };

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    handleResize();

    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
      if (panelRef.current) {
        panelRef.current.style.height = "";
        panelRef.current.style.top = "";
      }
    };
  }, [open, isIOS]);

  // Scroll input into view on iOS when focused
  const handleInputFocus = () => {
    if (!isIOS) return;
    setTimeout(() => {
      inputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 300);
  };

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setMessages([]);
        setInputMessage("");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendMessage.isPending) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    inputRef.current?.focus();

    try {
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role === "error" ? "assistant" : m.role,
        content: m.content,
      }));

      if (questionContext && messages.length === 0) {
        apiMessages[0] = {
          role: "user",
          content: `Question context: ${questionContext}\n\nMy question: ${userMessage.content}`,
        };
      }

      const response = await sendMessage.mutateAsync({ messages: apiMessages });

      const isError =
        response.includes("could not process") ||
        response.includes("try again");
      setMessages((prev) => [
        ...prev,
        {
          role: isError ? "error" : "assistant",
          content: response,
          timestamp: Date.now(),
        },
      ]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";

      if (errorMessage.includes("Payment required")) {
        toast.error("Please complete payment to access AI Assistant");
      } else if (errorMessage.includes("disabled")) {
        toast.error("AI Assistant is currently disabled");
      } else if (errorMessage.includes("not configured")) {
        toast.error(
          "AI Assistant is not configured. Please contact your administrator.",
        );
      } else if (
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Authentication")
      ) {
        toast.error("Please log in to use AI Assistant");
      } else {
        toast.error("Failed to get AI response. Please try again.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: "I apologize, but I encountered an error. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!open) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-transparent p-0 m-0 max-w-none w-full h-full border-0"
      aria-label="AI Study Assistant"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        onKeyDown={(e) => e.key === "Escape" && onOpenChange(false)}
        role="button"
        tabIndex={-1}
        aria-label="Close AI Assistant"
      />

      {/* Panel — fixed positioning keeps it above keyboard on iOS */}
      <div
        ref={panelRef}
        className="relative z-10 w-full sm:max-w-2xl sm:mx-4 bg-background sm:rounded-2xl border shadow-2xl flex flex-col"
        style={{
          // On mobile: fill from bottom, use dvh for dynamic viewport
          height: isIOS ? "100dvh" : undefined,
          maxHeight: isIOS ? "100dvh" : "92dvh",
          minHeight: "60dvh",
          // iOS: position fixed from top of visual viewport (updated by effect)
          position: isIOS ? "fixed" : undefined,
          bottom: isIOS ? "0" : undefined,
          left: isIOS ? "0" : undefined,
          right: isIOS ? "0" : undefined,
          borderRadius: isIOS ? "16px 16px 0 0" : undefined,
        }}
        data-ocid="ai-assistant-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">AI Study Assistant</p>
              <p className="text-xs text-muted-foreground">
                Ask anything about the current topic
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="Close AI Assistant"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading / disabled states */}
        {isCheckingEnabled ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !isEnabled ? (
          <div className="flex-1 p-6">
            <Alert>
              <AlertDescription>
                The AI Assistant feature is not currently enabled. Please
                contact your administrator.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            {/* Messages area — scrollable, takes remaining space */}
            <div
              ref={messagesAreaRef}
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 min-h-0"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center gap-3">
                  <Bot className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Hi! Need help with this question?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Type your question below to get started
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.timestamp}
                  className={`flex items-start gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      message.role === "user"
                        ? "bg-primary/10"
                        : message.role === "error"
                          ? "bg-destructive/10"
                          : "bg-muted"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-3.5 w-3.5 text-primary" />
                    ) : message.role === "error" ? (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div
                    className={`flex-1 rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words min-w-0 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.role === "error"
                          ? "bg-destructive/10 border border-destructive/20 text-foreground"
                          : "bg-muted text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {sendMessage.isPending && (
                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded-lg bg-muted shrink-0">
                    <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="rounded-xl px-3 py-2 bg-muted flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Thinking…
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area — always visible at bottom, sticky, iOS-safe */}
            <div
              className="border-t bg-background shrink-0"
              style={{
                paddingTop: "12px",
                paddingLeft: "16px",
                paddingRight: "16px",
                paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
                // Ensure input area never goes under the home indicator on iPhone
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  placeholder="Ask a question…"
                  className="flex-1 min-w-0 h-11 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                  disabled={sendMessage.isPending}
                  data-ocid="ai-chat-input"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sendMessage.isPending}
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  aria-label="Send message"
                  data-ocid="ai-chat-send"
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                AI responses are generated and may not always be accurate.
                Verify important information.
              </p>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
