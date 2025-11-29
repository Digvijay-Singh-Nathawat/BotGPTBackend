import { db } from "./db";
import {
  users,
  conversations,
  messages,
  type InsertUser,
  type User,
  type InsertConversation,
  type Conversation,
  type InsertMessage,
  type Message,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Conversation operations
  getConversation(id: string): Promise<Conversation | undefined>;
  listConversations(userId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;
  updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation>;

  // Message operations
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessagesByConversation(conversationId: string): Promise<void>;
}

export class DbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });
    return conversation;
  }

  async listConversations(userId: number): Promise<Conversation[]> {
    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.user_id, userId))
      .orderBy(desc(conversations.updated_at));
    return result;
  }

  async createConversation(insertConv: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConv)
      .returning();
    return conversation;
  }

  async deleteConversation(id: string): Promise<void> {
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation> {
    const [updated] = await db
      .update(conversations)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.conversation_id, conversationId))
      .orderBy(messages.timestamp);
    return result;
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(msg)
      .returning();
    return message;
  }

  async deleteMessagesByConversation(conversationId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.conversation_id, conversationId));
  }
}

export const storage = new DbStorage();
