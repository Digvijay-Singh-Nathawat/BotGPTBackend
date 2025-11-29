import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  created_at: timestamp("created_at").notNull().default(sql`now()`),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: integer("user_id").notNull().references(() => users.id),
  mode: varchar("mode", { length: 20 }).notNull().default("open"),
  title: varchar("title", { length: 255 }).default("New Conversation"),
  created_at: timestamp("created_at").notNull().default(sql`now()`),
  updated_at: timestamp("updated_at").notNull().default(sql`now()`),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversation_id: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  tokens_used: integer("tokens_used").default(0),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, created_at: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Conversation schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, created_at: true, updated_at: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Message schemas
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
