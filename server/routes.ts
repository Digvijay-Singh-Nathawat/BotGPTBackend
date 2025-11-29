import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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

  // Add message
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const validated = insertMessageSchema.parse({
        ...req.body,
        conversation_id: req.params.id,
      });
      const msg = await storage.createMessage(validated);

      // Update conversation timestamp
      const conv = await storage.getConversation(req.params.id);
      if (conv) {
        // Update title if first message
        if (validated.role === "user" && msg.content) {
          await storage.updateConversation(req.params.id, {
            title: msg.content.slice(0, 30) + (msg.content.length > 30 ? "..." : ""),
          });
        }
      }

      res.status(201).json(msg);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create message" });
      }
    }
  });

  return httpServer;
}
