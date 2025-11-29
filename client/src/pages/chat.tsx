import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ChatArea } from "@/components/layout/ChatArea";
import { Conversation, Message } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await api.initUser();
        const convs = await api.listConversations();
        setConversations(convs);
        if (convs.length > 0) {
          setActiveId(convs[0].id);
        } else {
          // Create initial conversation if none exist
          const newConv = await api.createConversation("open");
          setConversations([newConv]);
          setActiveId(newConv.id);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const activeConversation = conversations.find(c => c.id === activeId);

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
  };

  const handleNewChat = async () => {
    try {
      const newConv = await api.createConversation("open");
      setConversations([newConv, ...conversations]);
      setActiveId(newConv.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeId === id) {
        const remaining = conversations.filter(c => c.id !== id);
        if (remaining.length > 0) {
          setActiveId(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
      toast({
        description: "Conversation deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string, mode: "open" | "rag") => {
    if (!activeConversation) return;

    try {
      setIsTyping(true);

      // Add user message immediately to UI
      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: activeConversation.id,
        role: "user",
        content: content,
        tokens_used: 0,
        timestamp: new Date().toISOString()
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, userMessage], mode }
            : c
        )
      );

      // Send message and stream AI response
      const aiMessageId = crypto.randomUUID();
      let aiContent = "";

      setConversations(prev =>
        prev.map(c =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, {
                id: aiMessageId,
                conversation_id: activeConversation.id,
                role: "assistant",
                content: "",
                tokens_used: 0,
                timestamp: new Date().toISOString()
              }] }
            : c
        )
      );

      // Stream the response
      const { aiMessage } = await api.sendMessageStream(activeConversation.id, content, (chunk) => {
        aiContent += chunk;
        setConversations(prev =>
          prev.map(c =>
            c.id === activeId
              ? { ...c, messages: c.messages.map(m => 
                  m.id === aiMessageId ? { ...m, content: aiContent } : m
                ) }
              : c
          )
        );
      });
      
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-primary mx-auto animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading BOT GPT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <AppSidebar 
        currentConversationId={activeId}
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
      />
      <main className="flex-1 h-full relative">
        {activeConversation && (
          <ChatArea 
            messages={activeConversation.messages || []}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            mode={activeConversation.mode || "open"}
            setMode={(mode) => {
              setConversations(prev => 
                prev.map(c => c.id === activeId ? {...c, mode} : c)
              );
            }}
          />
        )}
      </main>
    </div>
  );
}
