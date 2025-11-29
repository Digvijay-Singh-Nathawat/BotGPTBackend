import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ChatArea } from "@/components/layout/ChatArea";
import { MOCK_CONVERSATIONS, Conversation, Message } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>(MOCK_CONVERSATIONS[0].id);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();

  const activeConversation = conversations.find(c => c.id === activeId) || conversations[0];

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
  };

  const handleNewChat = () => {
    const newId = `conv_${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      user_id: 1,
      mode: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      title: "New Conversation",
      messages: []
    };
    setConversations([newConv, ...conversations]);
    setActiveId(newId);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setActiveId(remaining[0].id);
      } else {
        // Create a new one if all deleted
        handleNewChat();
      }
    }
    toast({
      description: "Conversation deleted",
    });
  };

  const handleSendMessage = async (content: string, mode: "open" | "rag") => {
    if (!activeConversation) return;

    // Add user message
    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      conversation_id: activeConversation.id,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      tokens_used: 0
    };

    const updatedConv = {
      ...activeConversation,
      messages: [...activeConversation.messages, userMsg],
      updated_at: new Date().toISOString(),
      mode: mode // Update mode if changed
    };

    // Update state immediately
    setConversations(prev => prev.map(c => c.id === activeId ? updatedConv : c));
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        conversation_id: activeConversation.id,
        role: "assistant",
        content: `This is a mock response simulating the backend.\n\nYou asked: "${content}"\n\nIn the real implementation, this would call the GROQ API via LangChain.`,
        timestamp: new Date().toISOString(),
        tokens_used: Math.floor(Math.random() * 100) + 20
      };

      const finalConv = {
        ...updatedConv,
        messages: [...updatedConv.messages, aiMsg]
      };
      
      // Update title if it's the first message
      if (activeConversation.messages.length === 0) {
        finalConv.title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
      }

      setConversations(prev => prev.map(c => c.id === activeId ? finalConv : c));
      setIsTyping(false);
    }, 1500);
  };

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
        <ChatArea 
          messages={activeConversation?.messages || []}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          mode={activeConversation?.mode || "open"}
          setMode={(mode) => {
             setConversations(prev => prev.map(c => c.id === activeId ? {...c, mode} : c));
          }}
        />
      </main>
    </div>
  );
}
