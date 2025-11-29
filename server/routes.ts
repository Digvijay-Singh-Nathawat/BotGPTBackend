import type { Express } from "express";
import { createServer, type Server } from "http";

const PYTHON_API_BASE = "http://localhost:8000";

async function proxyToFastAPI(path: string, options: RequestInit = {}) {
  const response = await fetch(`${PYTHON_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return response;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", async (_req, res) => {
    try {
      const response = await proxyToFastAPI("/health");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.json({ status: "healthy", backend: "node" });
    }
  });

  app.post("/api/init", async (_req, res) => {
    try {
      const response = await proxyToFastAPI("/api/init", { method: "POST" });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to initialize user" });
    }
  });

  app.get("/api/conversations", async (_req, res) => {
    try {
      const response = await proxyToFastAPI("/conversations");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const response = await proxyToFastAPI(`/conversations/${req.params.id}`);
      if (!response.ok) {
        res.status(response.status).json({ error: "Conversation not found" });
        return;
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const { mode = "open" } = req.body;
      const response = await proxyToFastAPI("/conversations", {
        method: "POST",
        body: JSON.stringify({ user_id: 1, message: "Hello", mode }),
      });
      const data = await response.json();
      res.status(201).json({
        id: data.conversation_id,
        user_id: 1,
        mode,
        title: "New Conversation",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const response = await proxyToFastAPI(`/conversations/${req.params.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content) {
        res.status(400).json({ error: "Content is required" });
        return;
      }

      const response = await proxyToFastAPI(`/conversations/${req.params.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: content }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        res.status(response.status).json(error);
        return;
      }

      const data = await response.json();
      res.status(201).json(data);
    } catch (error) {
      console.error("Message creation error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  return httpServer;
}
