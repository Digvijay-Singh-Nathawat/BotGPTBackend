import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateResponse } from "./groq-service";
import { z } from "zod";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";

const DEMO_USER_ID = 1;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy" });
  });

  // Initialize demo user
  app.post("/api/init", async (_req, res) => {
    try {
      const user = await storage.getUserByEmail("demo@botgpt.ai");
      if (!user) {
        const newUser = await storage.createUser({
          email: "demo@botgpt.ai",
        });
        res.json({ user: newUser });
      } else {
        res.json({ user });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to initialize user" });
    }
  });

  // List conversations
  app.get("/api/conversations", async (_req, res) => {
    try {
      const convs = await storage.listConversations(DEMO_USER_ID);
      const convsWithMessages = await Promise.all(
        convs.map(async (conv) => ({
          ...conv,
          messages: await storage.getMessages(conv.id),
        }))
      );
      res.json(convsWithMessages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conv = await storage.getConversation(req.params.id);
      if (!conv) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }
      const msgs = await storage.getMessages(conv.id);
      res.json({ ...conv, messages: msgs });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const validated = insertConversationSchema.parse({
        ...req.body,
        user_id: DEMO_USER_ID,
      });
      const conv = await storage.createConversation(validated);
      res.status(201).json({ ...conv, messages: [] });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create conversation" });
      }
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      await storage.deleteConversation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Add message and generate AI response
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { content, role } = req.body;
      
      if (!content || !role) {
        res.status(400).json({ error: "Content and role are required" });
        return;
      }

      // Save user message
      const userMsg = await storage.createMessage({
        conversation_id: req.params.id,
        role: "user",
        content,
        tokens_used: 0,
      });

      // Update conversation title if first message
      const conv = await storage.getConversation(req.params.id);
      if (conv && conv.title === "New Conversation") {
        await storage.updateConversation(req.params.id, {
          title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
        });
      }

      // Get conversation history for context
      const messages = await storage.getMessages(req.params.id);
      const history = messages
        .filter(m => m.id !== userMsg.id)
        .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

      // Generate AI response using GROQ
      let aiResponse: string;
      try {
        aiResponse = await generateResponse(content, history);
      } catch (error) {
        console.error("GROQ Error:", error);
        aiResponse = "Sorry, I encountered an error processing your request. Please try again.";
      }

      // Save AI response
      const aiMsg = await storage.createMessage({
        conversation_id: req.params.id,
        role: "assistant",
        content: aiResponse,
        tokens_used: Math.floor(Math.random() * 150) + 50,
      });

      // Return the user message and AI response
      res.status(201).json({
        userMessage: userMsg,
        aiMessage: aiMsg,
      });
    } catch (error) {
      console.error("Message creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  return httpServer;
}
