
import { addMinutes, subDays, subHours } from "date-fns";

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  tokens_used: number;
}

export interface Conversation {
  id: string;
  user_id: number;
  mode: "open" | "rag";
  created_at: string;
  updated_at: string;
  messages: Message[];
  title?: string; // For UI display
}

export interface User {
  id: number;
  email: string;
  created_at: string;
}

// Mock Data
export const MOCK_USER: User = {
  id: 1,
  email: "demo@botgpt.ai",
  created_at: new Date().toISOString(),
};

const generateId = () => Math.random().toString(36).substring(2, 15);

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_1",
    user_id: 1,
    mode: "open",
    created_at: subDays(new Date(), 1).toISOString(),
    updated_at: subDays(new Date(), 1).toISOString(),
    title: "Python API Structure",
    messages: [
      {
        id: "msg_1",
        conversation_id: "conv_1",
        role: "user",
        content: "How do I structure a FastAPI project?",
        timestamp: subDays(new Date(), 1).toISOString(),
        tokens_used: 15,
      },
      {
        id: "msg_2",
        conversation_id: "conv_1",
        role: "assistant",
        content: "A common structure for FastAPI projects is:\n\n- `app/`: Main application code\n  - `main.py`: App entry point\n  - `api/`: API routes\n  - `core/`: Config and security\n  - `models/`: Database models\n  - `schemas/`: Pydantic schemas\n  - `services/`: Business logic\n\nWould you like a specific example for any of these?",
        timestamp: addMinutes(subDays(new Date(), 1), 1).toISOString(),
        tokens_used: 85,
      },
    ],
  },
  {
    id: "conv_2",
    user_id: 1,
    mode: "rag",
    created_at: subHours(new Date(), 2).toISOString(),
    updated_at: subHours(new Date(), 2).toISOString(),
    title: "Database Optimization",
    messages: [
      {
        id: "msg_3",
        conversation_id: "conv_2",
        role: "user",
        content: "My SQLite query is slow. How can I optimize it?",
        timestamp: subHours(new Date(), 2).toISOString(),
        tokens_used: 12,
      },
      {
        id: "msg_4",
        conversation_id: "conv_2",
        role: "assistant",
        content: "Here are a few ways to optimize SQLite queries:\n\n1. **Indexes**: Ensure you have indexes on columns used in WHERE, JOIN, and ORDER BY clauses.\n2. **Explain Query Plan**: Use `EXPLAIN QUERY PLAN` to see how SQLite is executing your query.\n3. **Transactions**: Wrap multiple write operations in a single transaction.\n4. **PRAGMA statements**: Adjust synchronous settings or cache size.\n\nCan you show me your query?",
        timestamp: addMinutes(subHours(new Date(), 2), 1).toISOString(),
        tokens_used: 120,
      },
    ],
  },
];
