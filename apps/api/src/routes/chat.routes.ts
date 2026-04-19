import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { clerkAuth } from "../platform/auth/clerk-middleware";
import { chatService } from "../platform/chat/chat-service";

const app = new Hono();
app.use("/*", clerkAuth);

// POST /api/me/chat — streaming chat
app.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  if (!body.message || typeof body.message !== "string") {
    return c.json({ error: "message is required" }, 400);
  }
  if (body.message.length > 10_000) {
    return c.json({ error: "message too long (max 10000 chars)" }, 400);
  }

  return streamSSE(c, async (stream) => {
    try {
      await chatService.sendMessage({
        userId: user.id,
        agentInstanceId: body.agentInstanceId ?? null,
        anchoredInsightId: body.anchoredInsightId ?? null,
        conversationId: body.conversationId ?? null,
        message: body.message,
        onEvent: async (event) => {
          await stream.writeSSE({
            event: event.type,
            data: JSON.stringify(event.data),
          });
        },
      });
    } catch (err) {
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({
          code: "internal_error",
          message: err instanceof Error ? err.message : "Unknown error",
        }),
      });
    }
  });
});

// GET /api/me/conversations
app.get("/conversations", async (c) => {
  const user = c.get("user");
  const convs = await chatService.listConversations(user.id);
  return c.json({ conversations: convs });
});

// GET /api/me/conversations/:id
app.get("/conversations/:id", async (c) => {
  const user = c.get("user");
  const result = await chatService.getConversation(
    user.id,
    c.req.param("id"),
  );
  if (!result) return c.json({ error: "Not found" }, 404);
  return c.json(result);
});

// DELETE /api/me/conversations/:id
app.delete("/conversations/:id", async (c) => {
  const user = c.get("user");
  await chatService.deleteConversation(user.id, c.req.param("id"));
  return c.body(null, 204);
});

export default app;
