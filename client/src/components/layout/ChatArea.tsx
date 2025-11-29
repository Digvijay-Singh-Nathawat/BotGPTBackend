import { useState, useEffect, useRef } from "react";
import { Send, Cpu, Sparkles, Copy, RotateCw, ThumbsUp, ThumbsDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Message } from "@/lib/mockData";

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (content: string, mode: "open" | "rag") => void;
  isTyping?: boolean;
  mode: "open" | "rag";
  setMode: (mode: "open" | "rag") => void;
}

export function ChatArea({ messages, onSendMessage, isTyping, mode, setMode }: ChatAreaProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input, mode);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      {/* Top Bar */}
      <div className="h-14 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border text-sm font-medium">
            <span className={cn("w-2 h-2 rounded-full", mode === "open" ? "bg-green-500" : "bg-blue-500")} />
            {mode === "open" ? "Open Conversation" : "RAG Mode (Mock)"}
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            {mode === "open" ? "Standard LLM chat" : "Retrieval Augmented Generation (Future)"}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("text-xs gap-2", mode === "open" && "bg-muted font-medium")}
            onClick={() => setMode("open")}
          >
            <Sparkles size={14} />
            Open
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("text-xs gap-2", mode === "rag" && "bg-muted font-medium")}
            onClick={() => setMode("rag")}
          >
            <Cpu size={14} />
            RAG
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-8 pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 opacity-50">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Welcome to BOT GPT</h3>
                <p className="text-sm text-muted-foreground">Start a conversation by typing a message below.</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4 group",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className={cn(
                  "w-8 h-8 border",
                  msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <AvatarFallback className={msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"}>
                    {msg.role === "assistant" ? <BotIcon /> : "U"}
                  </AvatarFallback>
                </Avatar>

                <div className={cn(
                  "flex flex-col max-w-[80%]",
                  msg.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium opacity-70">
                      {msg.role === "assistant" ? "BOT GPT" : "You"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className={cn(
                    "rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed shadow-sm",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-card border rounded-tl-sm"
                  )}>
                    {msg.content}
                  </div>

                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Copy size={12} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <RotateCw size={12} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Regenerate</TooltipContent>
                      </Tooltip>
                      <div className="flex-1" />
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {msg.tokens_used} tokens
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex gap-4">
               <Avatar className="w-8 h-8 border bg-primary text-primary-foreground">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <BotIcon />
                  </AvatarFallback>
                </Avatar>
              <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="max-w-3xl mx-auto relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === "open" ? "Message BOT GPT..." : "Ask a question about your documents (Mock)..."}
            className="min-h-[50px] max-h-[200px] w-full resize-none rounded-2xl pl-4 pr-12 py-3 bg-muted/50 border-transparent focus:border-input focus:bg-background transition-all shadow-sm"
          />
          <Button 
            size="icon" 
            className={cn(
              "absolute right-2 bottom-2 h-8 w-8 rounded-full transition-all",
              input.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted"
            )}
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send size={14} />
          </Button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-muted-foreground">
            BOT GPT can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}

function BotIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}
