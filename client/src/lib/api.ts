import { Conversation, Message } from "./mockData";

const API_BASE = "/api";

export async function initUser() {
  const res = await fetch(`${API_BASE}/init`, { method: "POST" });
  return res.json();
}

export async function listConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/conversations`);
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations/${id}`);
  if (!res.ok) throw new Error("Failed to fetch conversation");
  return res.json();
}

export async function createConversation(mode: "open" | "rag" = "open"): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete conversation");
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ userMessage: Message; aiMessage: Message }> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  
  const data = await res.json();
  
  return {
    userMessage: data.userMessage || {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: "user",
      content: content,
      tokens_used: 0,
      timestamp: new Date().toISOString()
    },
    aiMessage: data.aiMessage || {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: "assistant",
      content: data.response || "No response",
      tokens_used: 0,
      timestamp: new Date().toISOString()
    }
  };
}

export async function sendMessageStream(
  conversationId: string,
  content: string,
  onChunk: (chunk: string) => void
): Promise<{ aiMessage: Message }> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to send message");

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";

  if (!reader) throw new Error("No response body");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          const token = parsed.token || "";
          fullContent += token;
          onChunk(token);
        } catch (e) {
          // Ignore JSON parse errors for incomplete data
        }
      }
    }
  }

  return {
    aiMessage: {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: "assistant",
      content: fullContent,
      tokens_used: 0,
      timestamp: new Date().toISOString()
    }
  };
}
