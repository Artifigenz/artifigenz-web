/**
 * End-to-end test for the Finance Subscriptions skill.
 *
 * Seeds a test user, agent instance, and fake transactions with recurring
 * patterns, then runs the skill and prints the detected insights.
 *
 * Run with: npx tsx src/agents/finance/test-subscriptions.ts
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import {
  db,
  users,
  agentInstances,
  agentInstanceSkills,
  financeTransactions,
  financeSubscriptions,
  dataSourceConnections,
  insights,
} from "@artifigenz/db";
import { AgentRegistry } from "../../platform/registry/agent-registry";
import { register as registerFinance } from "./index";
import { SkillExecutor } from "../../platform/execution/skill-executor";

const TEST_CLERK_ID = "test_user_finance_e2e";

async function cleanup() {
  // Delete any existing test user and cascade
  await db.delete(users).where(eq(users.clerkId, TEST_CLERK_ID));
}

async function seedTestData() {
  console.log("Seeding test data...");

  // 1. Create test user
  const [user] = await db
    .insert(users)
    .values({
      clerkId: TEST_CLERK_ID,
      email: "test@artifigenz.com",
      name: "Test User",
      timezone: "America/New_York",
    })
    .returning();

  console.log(`  User created: ${user.id}`);

  // 2. Create finance agent instance
  const [agent] = await db
    .insert(agentInstances)
    .values({
      userId: user.id,
      agentTypeId: "finance",
      status: "active",
      goal: "Find money I'm wasting",
    })
    .returning();

  console.log(`  Agent instance created: ${agent.id}`);

  // 3. Enable the subscriptions skill
  await db.insert(agentInstanceSkills).values({
    agentInstanceId: agent.id,
    skillId: "finance.subscriptions",
    isEnabled: true,
  });

  // 4. Create a fake data source connection (required for FK)
  const [connection] = await db
    .insert(dataSourceConnections)
    .values({
      agentInstanceId: agent.id,
      dataSourceTypeId: "file-upload",
      displayName: "Test Connection",
      status: "active",
    })
    .returning();

  // 5. Seed fake transactions with recurring patterns
  const today = new Date();
  const fakeTxs: Array<{
    transactionDate: string;
    description: string;
    merchantName: string;
    amount: string;
    accountName: string;
    category: string;
  }> = [];

  // Netflix — $15.99/mo for 6 months
  for (let i = 0; i < 6; i++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    fakeTxs.push({
      transactionDate: date.toISOString().slice(0, 10),
      description: "NETFLIX.COM 866-579-7172 CA",
      merchantName: "Netflix",
      amount: "15.99",
      accountName: "Chase Checking",
      category: "ENTERTAINMENT",
    });
  }

  // Spotify — $9.99/mo for 4 months
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - (i + 1));
    fakeTxs.push({
      transactionDate: date.toISOString().slice(0, 10),
      description: "SPOTIFY USA",
      merchantName: "Spotify",
      amount: "9.99",
      accountName: "Chase Checking",
      category: "ENTERTAINMENT",
    });
  }
  // Most recent Spotify charge has a higher price
  fakeTxs.push({
    transactionDate: today.toISOString().slice(0, 10),
    description: "SPOTIFY USA",
    merchantName: "Spotify",
    amount: "9.99",
    accountName: "Chase Checking",
    category: "ENTERTAINMENT",
  });

  // Gym membership — $49.99/mo for 8 months
  for (let i = 0; i < 8; i++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    date.setDate(5); // Same day every month
    fakeTxs.push({
      transactionDate: date.toISOString().slice(0, 10),
      description: "EQUINOX FITNESS",
      merchantName: "Equinox",
      amount: "49.99",
      accountName: "Chase Checking",
      category: "GENERAL_SERVICES",
    });
  }

  // NYT — $17/mo, charging tomorrow (to trigger reminder)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() - 29); // last charge ~29 days ago → next charge tomorrow
  for (let i = 0; i < 4; i++) {
    const date = new Date(tomorrow);
    date.setMonth(date.getMonth() - i);
    fakeTxs.push({
      transactionDate: date.toISOString().slice(0, 10),
      description: "NYTimes.com Subscription",
      merchantName: "NY Times",
      amount: "17.00",
      accountName: "Amex Gold",
      category: "ENTERTAINMENT",
    });
  }

  // Random one-off purchases (should NOT be detected)
  fakeTxs.push({
    transactionDate: today.toISOString().slice(0, 10),
    description: "STARBUCKS #12345",
    merchantName: "Starbucks",
    amount: "5.75",
    accountName: "Chase Checking",
    category: "FOOD_AND_DRINK",
  });
  fakeTxs.push({
    transactionDate: today.toISOString().slice(0, 10),
    description: "AMAZON.COM*MK123",
    merchantName: "Amazon",
    amount: "42.99",
    accountName: "Amex Gold",
    category: "GENERAL_MERCHANDISE",
  });

  await db.insert(financeTransactions).values(
    fakeTxs.map((tx) => ({
      ...tx,
      dataSourceConnectionId: connection.id,
      agentInstanceId: agent.id,
      source: "test" as const,
    })),
  );

  console.log(`  Seeded ${fakeTxs.length} transactions`);

  return { user, agent };
}

async function runSkill(agentInstanceId: string) {
  console.log("\nRunning subscriptions skill...\n");

  const registry = new AgentRegistry();
  registerFinance(registry);

  const executor = new SkillExecutor(registry);
  const result = await executor.execute({
    agentInstanceId,
    skillId: "finance.subscriptions",
  });

  console.log(`  Produced ${result.insightIds.length} insights\n`);

  // Fetch and display the insights
  const createdInsights = await db
    .select()
    .from(insights)
    .where(eq(insights.agentInstanceId, agentInstanceId));

  for (const insight of createdInsights) {
    console.log(`  [${insight.insightTypeId}]${insight.isCritical ? " CRITICAL" : ""}`);
    console.log(`  ${insight.title}`);
    console.log(`  ${insight.description}`);
    console.log();
  }

  // Fetch detected subscriptions
  const subs = await db
    .select()
    .from(financeSubscriptions)
    .where(eq(financeSubscriptions.agentInstanceId, agentInstanceId));

  console.log(`\n  Detected ${subs.length} subscriptions in DB:`);
  for (const sub of subs) {
    console.log(`    - ${sub.merchantName}: $${sub.amount} ${sub.frequency} (next: ${sub.nextChargeDate})`);
  }
}

async function main() {
  try {
    await cleanup();
    const { agent } = await seedTestData();
    await runSkill(agent.id);
    console.log("\nTest complete!");
  } catch (err) {
    console.error("\nTest failed:", err);
    process.exit(1);
  } finally {
    await cleanup();
    console.log("Cleanup complete.");
    process.exit(0);
  }
}

main();
