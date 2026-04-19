import { eq, asc, and } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { db, conversations, messages, users } from "@artifigenz/db";
import { getClaudeClient } from "../../agents/finance/lib/claude-client";
import { toolExecutor } from "./tool-executor";
import { loadPromptContext, buildSystemPrompt } from "./prompt-builder";
import type { SendMessageParams, SSEEvent } from "./types";

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 2048;
const TEMPERATURE = 0.5;
const MAX_TOOL_ROUNDS = 5;

export class ChatService {
  /**
   * Send a user message, stream the assistant response via onEvent callback.
   * Handles the full tool-use loop (stream → tool call → execute → feed back → continue).
   */
  async sendMessage(params: SendMessageParams): Promise<void> {
    const { userId, message, onEvent } = params;

    // ─── 1. Load user ────────────────────────────────────────────
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new Error(`User ${userId} not found`);

    // ─── 2. Create or load conversation ──────────────────────────
    let conversationId = params.conversationId ?? null;
    let isNewConversation = false;
    if (!conversationId) {
      if (!params.agentInstanceId) {
        throw new Error("agentInstanceId is required for new conversations");
      }
      const [newConv] = await db
        .insert(conversations)
        .values({
          userId,
          agentInstanceId: params.agentInstanceId,
          anchoredInsightId: params.anchoredInsightId ?? undefined,
          title: message.slice(0, 60),
          messageCount: 0,
        })
        .returning();
      conversationId = newConv.id;
      isNewConversation = true;
    }

    onEvent({
      type: "conversation",
      data: { conversationId, title: isNewConversation ? message.slice(0, 60) : undefined },
    });

    // ─── 3. Persist user message ─────────────────────────────────
    await db.insert(messages).values({
      conversationId,
      role: "user",
      content: message,
    });

    // ─── 4. Load conversation history ────────────────────────────
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    // ─── 5. Build system prompt from live context ────────────────
    const promptCtx = await loadPromptContext({
      userId,
      anchoredInsightId: params.anchoredInsightId,
    });
    const systemPrompt = buildSystemPrompt(promptCtx);

    // ─── 6. Convert history to Claude message format ─────────────
    const claudeMessages: Anthropic.MessageParam[] = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // ─── 7. Tool loop — repeat until Claude stops calling tools ──
    const client = getClaudeClient();
    const tools = toolExecutor.getClaudeTools();
    let assistantContent = "";
    const toolCallHistory: Array<{ tool: string; input: unknown; result: unknown }> = [];
    let round = 0;

    while (round < MAX_TOOL_ROUNDS) {
      round++;
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: systemPrompt,
        tools,
        messages: claudeMessages,
      });

      // Buffer for current assistant turn
      type TurnBlock =
        | { type: "text"; text: string }
        | { type: "tool_use"; id: string; name: string; input: unknown; _partialJson?: string };
      const turnBlocks: TurnBlock[] = [];
      let turnText = "";

      for await (const event of stream) {
        if (event.type === "content_block_start") {
          const block = event.content_block;
          if (block.type === "text") {
            turnBlocks.push({ type: "text", text: "" });
          } else if (block.type === "tool_use") {
            turnBlocks.push({
              type: "tool_use",
              id: block.id,
              name: block.name,
              input: {},
            });
          }
        } else if (event.type === "content_block_delta") {
          const delta = event.delta;
          const lastBlock = turnBlocks[turnBlocks.length - 1];
          if (delta.type === "text_delta" && lastBlock?.type === "text") {
            lastBlock.text += delta.text;
            turnText += delta.text;
            onEvent({ type: "delta", data: { content: delta.text } });
          } else if (
            delta.type === "input_json_delta" &&
            lastBlock?.type === "tool_use"
          ) {
            // Accumulate partial JSON for tool input
            lastBlock._partialJson = (lastBlock._partialJson ?? "") + delta.partial_json;
          }
        } else if (event.type === "content_block_stop") {
          // Finalize block (parse tool input JSON if tool_use)
          const lastBlock = turnBlocks[turnBlocks.length - 1];
          if (lastBlock?.type === "tool_use") {
            try {
              lastBlock.input = JSON.parse(lastBlock._partialJson ?? "{}");
            } catch {
              lastBlock.input = {};
            }
          }
        }
      }

      const finalMessage = await stream.finalMessage();
      const stopReason = finalMessage.stop_reason;
      assistantContent += turnText;

      // Check if Claude called any tools
      const toolUseBlocks = finalMessage.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      if (stopReason !== "tool_use" || toolUseBlocks.length === 0) {
        // Stream ended without tool use → we're done
        break;
      }

      // Execute each tool call
      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        onEvent({
          type: "tool_use",
          data: {
            tool: toolUse.name,
            input: toolUse.input as Record<string, unknown>,
          },
        });

        const result = await toolExecutor.execute(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
          {
            user,
            agentInstanceId: params.agentInstanceId ?? null,
          },
        );

        onEvent({
          type: "tool_result",
          data: { tool: toolUse.name, result },
        });

        toolCallHistory.push({
          tool: toolUse.name,
          input: toolUse.input,
          result,
        });

        toolResultBlocks.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // Feed tool results back to Claude for the next round
      claudeMessages.push({
        role: "assistant",
        content: finalMessage.content,
      });
      claudeMessages.push({
        role: "user",
        content: toolResultBlocks,
      });
    }

    // ─── 8. Persist the assistant response ──────────────────────
    const [assistantMsg] = await db
      .insert(messages)
      .values({
        conversationId,
        role: "assistant",
        content: assistantContent,
        toolCalls:
          toolCallHistory.length > 0
            ? (toolCallHistory as unknown as Record<string, unknown>)
            : null,
      })
      .returning();

    // Update conversation message count + updated_at
    await db
      .update(conversations)
      .set({
        messageCount: history.length + 2,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    onEvent({
      type: "done",
      data: { messageId: assistantMsg.id },
    });
  }

  /**
   * List user's conversations.
   */
  async listConversations(userId: string) {
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(asc(conversations.updatedAt));
  }

  /**
   * Get a single conversation with its messages.
   */
  async getConversation(userId: string, conversationId: string) {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId),
        ),
      )
      .limit(1);

    if (!conv) return null;

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return { conversation: conv, messages: msgs };
  }

  /**
   * Delete a conversation.
   */
  async deleteConversation(userId: string, conversationId: string) {
    await db
      .delete(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId),
        ),
      );
  }
}

export const chatService = new ChatService();
