import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, X, Bot, User, AlertCircle } from 'lucide-react';
import { useIsAiAssistantEnabled, useSendAiMessage } from '../hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: number;
}

interface AiAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionContext?: string;
}

export function AiAssistant({ open, onOpenChange, questionContext }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [viewportHeight, setViewportHeight] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const { data: isEnabled, isLoading: isCheckingEnabled } = useIsAiAssistantEnabled();
  const sendMessage = useSendAiMessage();

  // Detect mobile devices
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // Enhanced viewport resize handling for mobile keyboard
  useEffect(() => {
    if (!open) return;

    // Use visualViewport API for better mobile keyboard handling
    if (typeof window !== 'undefined' && window.visualViewport) {
      const handleViewportChange = () => {
        if (!window.visualViewport) return;
        
        const viewport = window.visualViewport;
        setViewportHeight(viewport.height);
        
        // On iOS, adjust scroll position when keyboard opens
        if (isIOS && inputContainerRef.current) {
          const keyboardHeight = window.innerHeight - viewport.height;
          
          if (keyboardHeight > 100) {
            // Keyboard is open - ensure input is visible
            requestAnimationFrame(() => {
              if (textareaRef.current) {
                textareaRef.current.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'nearest',
                  inline: 'nearest'
                });
              }
            });
          }
        }
      };

      // Add listeners
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
      
      // Initial setup
      handleViewportChange();

      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
          window.visualViewport.removeEventListener('scroll', handleViewportChange);
        }
      };
    } else {
      // Fallback for browsers without visualViewport
      const handleResize = () => {
        setViewportHeight(window.innerHeight);
      };
      
      window.addEventListener('resize', handleResize);
      handleResize();
      
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [open, isIOS]);

  // Auto-focus input when modal opens (with delay for mobile)
  useEffect(() => {
    if (open && textareaRef.current) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, isMobile ? 500 : 100);
      return () => clearTimeout(timer);
    }
  }, [open, isMobile]);

  // Reset conversation when modal closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setMessages([]);
        setInputMessage('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        const scrollToBottom = () => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        };
        
        scrollToBottom();
        setTimeout(scrollToBottom, 100);
        setTimeout(scrollToBottom, 300);
      }
    }
  }, [messages, sendMessage.isPending]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendMessage.isPending) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Blur input on mobile to close keyboard after sending
    if (isMobile && textareaRef.current) {
      textareaRef.current.blur();
    }

    try {
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role === 'error' ? 'assistant' : m.role,
        content: m.content,
      }));

      // If there's question context, prepend it to the first user message
      if (questionContext && messages.length === 0) {
        apiMessages[0] = {
          role: 'user',
          content: `Question context: ${questionContext}\n\nMy question: ${userMessage.content}`,
        };
      }

      const response = await sendMessage.mutateAsync({ messages: apiMessages });

      // Check if response is an error message
      if (response.includes('could not process your request') || 
          response.includes('try again') ||
          response.includes('error') ||
          response.includes('Error')) {
        const errorMessage: Message = {
          role: 'error',
          content: response,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } else {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      
      const errorMessage = error.message || 'An error occurred';
      
      if (errorMessage.includes('Payment required')) {
        toast.error('Please complete payment to access AI Assistant');
      } else if (errorMessage.includes('disabled')) {
        toast.error('AI Assistant is currently disabled');
      } else if (errorMessage.includes('not configured')) {
        toast.error('AI Assistant is not configured. Please contact your administrator.');
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('Authentication')) {
        toast.error('Please log in to use AI Assistant');
      } else {
        toast.error('Failed to get AI response. Please try again.');
      }
      
      const errorMsg: Message = {
        role: 'error',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    // Blur input to close keyboard before closing modal
    if (textareaRef.current) {
      textareaRef.current.blur();
    }
    
    setTimeout(() => {
      onOpenChange(false);
    }, 100);
  };

  if (isCheckingEnabled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>AI Assistant</DialogTitle>
            <DialogDescription>
              Loading AI Assistant...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isEnabled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>AI Assistant</DialogTitle>
            <DialogDescription>
              AI Assistant is currently unavailable
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertDescription>
              The AI Assistant feature is not currently enabled. Please contact your administrator to enable this feature.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  // Calculate dynamic heights for mobile
  const windowHeight = viewportHeight || window.innerHeight;
  const maxDialogHeight = isMobile ? windowHeight * 0.95 : 600;
  const scrollAreaHeight = isMobile ? windowHeight * 0.5 : 400;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={contentRef}
        className="flex flex-col p-0 gap-0 w-[95vw] max-w-2xl"
        style={{
          maxHeight: `${maxDialogHeight}px`,
          height: isMobile ? `${maxDialogHeight}px` : 'auto',
        }}
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg">AI Study Assistant</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Ask questions about the current topic
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea 
          ref={scrollAreaRef} 
          className="flex-1 px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto"
          style={{
            maxHeight: `${scrollAreaHeight}px`,
            minHeight: isMobile ? '200px' : '300px',
          }}
        >
          <div className="space-y-3 sm:space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full py-8 sm:py-12">
                <div className="text-center space-y-2">
                  <Bot className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Hi! Need help with this question?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Type your question below to get started
                  </p>
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 sm:space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                    message.role === 'user'
                      ? 'bg-primary/10'
                      : message.role === 'error'
                      ? 'bg-destructive/10'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  ) : message.role === 'error' ? (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                  ) : (
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={`flex-1 rounded-lg p-2 sm:p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'error'
                      ? 'bg-destructive/10 border border-destructive/20'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p className="text-[10px] sm:text-xs opacity-70 mt-1 sm:mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {sendMessage.isPending && (
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-muted shrink-0">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 rounded-lg p-2 sm:p-3 bg-muted">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div 
          ref={inputContainerRef}
          className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-background shrink-0"
        >
          <div className="flex items-end space-x-2 gap-2">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your question... (Enter to send)"
              className="min-h-[50px] sm:min-h-[60px] max-h-[100px] sm:max-h-[120px] resize-none text-sm"
              disabled={sendMessage.isPending}
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || sendMessage.isPending}
              size="icon"
              className="h-[50px] w-[50px] sm:h-[60px] sm:w-[60px] shrink-0"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
            AI responses are generated and may not always be accurate. Please verify important information.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

