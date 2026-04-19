/**
 * End-to-end test for the chat system.
 *
 * Seeds a user with finance data (transactions, subscriptions), then runs
 * a chat conversation that should trigger tool calls.
 *
 * Run with: npx tsx src/platform/chat/test-chat.ts
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import {
  db,
  users,
  agentInstances,
  agentInstanceSkills,
  financeSubscriptions,
  financeTransactions,
  dataSourceConnections,
  conversations,
  messages,
} from "@artifigenz/db";
import { chatService } from "./chat-service";
import type { SSEEvent } from "./types";

const TEST_CLERK_ID = "test_user_chat_e2e";

async function cleanup() {
  await db.delete(users).where(eq(users.clerkId, TEST_CLERK_ID));
}

async function main() {
  try {
    await cleanup();

    // ─── 1. Seed user + agent + subscriptions ────────────────────
    console.log("1. Seeding test user with finance data...");
    const [user] = await db
      .insert(users)
      .values({
        clerkId: TEST_CLERK_ID,
        email: "chat-test@artifigenz.com",
        name: "Chat Test",
        timezone: "America/New_York",
      })
      .returning();

    const [agent] = await db
      .insert(agentInstances)
      .values({
        userId: user.id,
        agentTypeId: "finance",
        status: "active",
        goal: "Save $500/month by cutting wasted subscriptions",
      })
      .returning();

    await db.insert(agentInstanceSkills).values({
      agentInstanceId: agent.id,
      skillId: "finance.subscriptions",
      isEnabled: true,
    });

    const [connection] = await db
      .insert(dataSourceConnections)
      .values({
        agentInstanceId: agent.id,
        dataSourceTypeId: "file-upload",
        displayName: "Test",
        status: "active",
      })
      .returning();

    // Seed subscriptions
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 3);

    await db.insert(financeSubscriptions).values([
      {
        agentInstanceId: agent.id,
        merchantName: "Netflix",
        amount: "15.99",
        frequency: "monthly",
        lastChargeDate: today.toISOString().slice(0, 10),
        nextChargeDate: nextWeek.toISOString().slice(0, 10),
        accountName: "Chase Checking",
        status: "active",
      },
      {
        agentInstanceId: agent.id,
        merchantName: "Spotify",
        amount: "9.99",
        frequency: "monthly",
        lastChargeDate: today.toISOString().slice(0, 10),
        nextChargeDate: nextWeek.toISOString().slice(0, 10),
        accountName: "Chase Checking",
        status: "active",
      },
      {
        agentInstanceId: agent.id,
        merchantName: "Equinox",
        amount: "49.99",
        frequency: "monthly",
        lastChargeDate: today.toISOString().slice(0, 10),
        nextChargeDate: new Date(today.getTime() + 10 * 86400000)
          .toISOString()
          .slice(0, 10),
        accountName: "Amex Gold",
        status: "active",
      },
    ]);

    // Seed a few transactions
    await db.insert(financeTransactions).values([
      {
        agentInstanceId: agent.id,
        dataSourceConnectionId: connection.id,
        transactionDate: today.toISOString().slice(0, 10),
        description: "Netflix",
        merchantName: "Netflix",
        amount: "15.99",
        category: "ENTERTAINMENT",
        accountName: "Chase Checking",
        source: "test",
      },
      {
        agentInstanceId: agent.id,
        dataSourceConnectionId: connection.id,
        transactionDate: today.toISOString().slice(0, 10),
        description: "Spotify",
        merchantName: "Spotify",
        amount: "9.99",
        category: "ENTERTAINMENT",
        accountName: "Chase Checking",
        source: "test",
      },
    ]);

    console.log(`   user: ${user.id}`);
    console.log(`   agent: ${agent.id}`);
    console.log(`   3 subscriptions + 2 transactions seeded`);

    // ─── 2. Send first chat message (should use tools) ──────────
    console.log("\n2. Sending chat message: 'Which subscriptions charge this week?'");
    console.log("\n   Streaming response:");
    console.log("   ───────────────────");

    const events: SSEEvent[] = [];
    let conversationId: string | null = null;
    let assistantText = "";

    await chatService.sendMessage({
      userId: user.id,
      agentInstanceId: agent.id,
      message: "Which subscriptions charge this week?",
      onEvent: (event) => {
        events.push(event);
        switch (event.type) {
          case "conversation":
            conversationId = event.data.conversationId;
            break;
          case "delta":
            process.stdout.write(event.data.content);
            assistantText += event.data.content;
            break;
          case "tool_use":
            console.log(`\n\n   [TOOL CALL] ${event.data.tool}(${JSON.stringify(event.data.input)})`);
            break;
          case "tool_result": {
            const resultPreview = JSON.stringify(event.data.result).slice(0, 200);
            console.log(`   [TOOL RESULT] ${resultPreview}${resultPreview.length >= 200 ? "..." : ""}\n`);
            break;
          }
          case "done":
            console.log("\n   ───────────────────");
            console.log(`   [DONE] messageId: ${event.data.messageId.slice(0, 8)}`);
            break;
          case "error":
            console.error(`\n   [ERROR] ${event.data.message}`);
            break;
        }
      },
    });

    console.log(`\n   Total events: ${events.length}`);
    console.log(`   Tool calls: ${events.filter((e) => e.type === "tool_use").length}`);

    // ─── 3. Send a follow-up message in the same conversation ───
    if (conversationId) {
      console.log(`\n3. Sending follow-up: 'What's my most expensive one?'`);
      console.log("\n   Streaming response:");
      console.log("   ───────────────────");

      await chatService.sendMessage({
        userId: user.id,
        agentInstanceId: agent.id,
        conversationId,
        message: "What's my most expensive one?",
        onEvent: (event) => {
          switch (event.type) {
            case "delta":
              process.stdout.write(event.data.content);
              break;
            case "tool_use":
              console.log(`\n\n   [TOOL CALL] ${event.data.tool}(${JSON.stringify(event.data.input)})`);
              break;
            case "tool_result": {
              const resultPreview = JSON.stringify(event.data.result).slice(0, 200);
              console.log(`   [TOOL RESULT] ${resultPreview}${resultPreview.length >= 200 ? "..." : ""}\n`);
              break;
            }
            case "done":
              console.log("\n   ───────────────────");
              break;
          }
        },
      });
    }

    // ─── 4. Verify conversation persisted ─────────────────────────
    if (conversationId) {
      const result = await chatService.getConversation(user.id, conversationId);
      console.log(`\n4. Conversation persisted with ${result?.messages.length ?? 0} messages`);
    }

    const allConvs = await chatService.listConversations(user.id);
    console.log(`   User has ${allConvs.length} conversation(s)`);

    console.log("\nTest complete!");
  } catch (err) {
    console.error("\nTest failed:", err);
    if (err instanceof Error) console.error(err.stack);
    process.exit(1);
  } finally {
    await cleanup();
    console.log("Cleanup complete.");
    process.exit(0);
  }
}

main();
