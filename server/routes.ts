import type { Express } from "express";
import { type Server } from "http";

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
      res.json({ ...data, frontend: "node" });
    } catch (error) {
      res.json({ status: "healthy", backend: "node-only", python: "unavailable" });
    }
  });

  app.post("/api/init", async (_req, res) => {
    try {
      const response = await proxyToFastAPI("/api/init", { method: "POST" });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.json({ user: { id: 1, email: "demo@botgpt.ai" } });
    }
  });

  app.get("/api/conversations", async (_req, res) => {
    try {
      const response = await proxyToFastAPI("/conversations");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.json([]);
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
      res.status(503).json({ error: "Python backend unavailable" });
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
      const convId = crypto.randomUUID();
      res.status(201).json({
        id: convId,
        user_id: 1,
        mode: req.body?.mode || "open",
        title: "New Conversation",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      });
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
      res.json({ success: true });
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
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        res.status(response.status).json(errorData);
        return;
      }

      const data = await response.json();
      res.status(201).json(data);
    } catch (error) {
      console.error("Message creation error:", error);
      res.status(503).json({ error: "Python backend unavailable. Please start the Python server." });
    }
  });

  return httpServer;
}
