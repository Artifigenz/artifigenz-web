/**
 * End-to-end test for the Plaid adapter + Subscriptions skill.
 *
 * Uses Plaid sandbox to create a fake public_token, exchange it for an
 * access_token, sync transactions, then run the subscriptions skill on the
 * synced data.
 *
 * Run with: npx tsx src/agents/finance/test-plaid.ts
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import {
  db,
  users,
  agentInstances,
  agentInstanceSkills,
  dataSourceConnections,
  financeTransactions,
  financeSubscriptions,
  insights,
} from "@artifigenz/db";
import { Products } from "plaid";
import { getPlaidClient } from "./lib/plaid-client";
import { AgentRegistry } from "../../platform/registry/agent-registry";
import { register as registerFinance } from "./index";
import { SkillExecutor } from "../../platform/execution/skill-executor";
import { plaidAdapter } from "./data-sources/plaid.adapter";

const TEST_CLERK_ID = "test_user_plaid_e2e";

async function cleanup() {
  await db.delete(users).where(eq(users.clerkId, TEST_CLERK_ID));
}

async function main() {
  try {
    await cleanup();

    // ─── 1. Create test user + agent ──────────────────────────────
    console.log("1. Creating test user + finance agent...");
    const [user] = await db
      .insert(users)
      .values({
        clerkId: TEST_CLERK_ID,
        email: "plaid-test@artifigenz.com",
        name: "Plaid Test",
        timezone: "America/New_York",
      })
      .returning();

    const [agent] = await db
      .insert(agentInstances)
      .values({
        userId: user.id,
        agentTypeId: "finance",
        status: "active",
        goal: "Track subscriptions",
      })
      .returning();

    await db.insert(agentInstanceSkills).values({
      agentInstanceId: agent.id,
      skillId: "finance.subscriptions",
      isEnabled: true,
    });

    console.log(`   user: ${user.id}`);
    console.log(`   agent: ${agent.id}`);

    // ─── 2. Use Plaid sandbox to create public_token ─────────────
    console.log("\n2. Creating Plaid sandbox public_token...");
    const plaid = getPlaidClient();
    const sandboxResponse = await plaid.sandboxPublicTokenCreate({
      institution_id: "ins_109508", // First Platypus Bank (sandbox)
      initial_products: [Products.Transactions],
    });
    const publicToken = sandboxResponse.data.public_token;
    console.log(`   public_token: ${publicToken.slice(0, 30)}...`);

    // ─── 3. Finalize connection (exchange for access_token) ──────
    console.log("\n3. Finalizing connection via adapter.finalizeConnection()...");
    const connection = await plaidAdapter.finalizeConnection({
      agentInstanceId: agent.id,
      dataSourceTypeId: "plaid",
      publicToken,
      metadata: { institutionName: "First Platypus Bank (sandbox)" },
    });
    console.log(`   connection: ${connection.id}`);

    // ─── 4. Wait for Plaid to finish generating transactions ─────
    // Sandbox: transactions are usually ready within a few seconds
    console.log("\n4. Waiting for sandbox transactions to be ready (10s)...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // ─── 5. Sync transactions ────────────────────────────────────
    console.log("\n5. Running adapter.sync()...");
    await plaidAdapter.sync(connection);

    const txCount = await db
      .select()
      .from(financeTransactions)
      .where(eq(financeTransactions.agentInstanceId, agent.id));
    console.log(`   Synced ${txCount.length} transactions`);

    if (txCount.length === 0) {
      console.log("\n⚠ No transactions synced. Sandbox may need more time.");
      console.log("  Try running the test again in a minute.");
      return;
    }

    // Show a sample
    console.log("\n   Sample transactions:");
    for (const tx of txCount.slice(0, 5)) {
      console.log(`     ${tx.transactionDate}  ${tx.merchantName ?? tx.description}  $${tx.amount}  (${tx.accountName})`);
    }

    // ─── 6. Run subscriptions skill ──────────────────────────────
    console.log("\n6. Running subscriptions skill on synced data...");
    const registry = new AgentRegistry();
    registerFinance(registry);
    const executor = new SkillExecutor(registry);
    const result = await executor.execute({
      agentInstanceId: agent.id,
      skillId: "finance.subscriptions",
    });
    console.log(`   Produced ${result.insightIds.length} insights`);

    // ─── 7. Show detected subscriptions + insights ───────────────
    const subs = await db
      .select()
      .from(financeSubscriptions)
      .where(eq(financeSubscriptions.agentInstanceId, agent.id));

    console.log(`\n   Detected ${subs.length} subscriptions:`);
    for (const sub of subs) {
      console.log(`     - ${sub.merchantName}: $${sub.amount} ${sub.frequency} (next: ${sub.nextChargeDate})`);
    }

    const createdInsights = await db
      .select()
      .from(insights)
      .where(eq(insights.agentInstanceId, agent.id));

    console.log(`\n   Insights generated:`);
    for (const insight of createdInsights) {
      console.log(`     [${insight.insightTypeId}] ${insight.title}`);
    }

    console.log("\nTest complete!");
  } catch (err) {
    console.error("\nTest failed:", err);
    if (err && typeof err === "object" && "response" in err) {
      const plaidErr = (err as { response?: { data?: unknown } }).response?.data;
      console.error("Plaid error details:", plaidErr);
    }
    process.exit(1);
  } finally {
    await cleanup();
    console.log("Cleanup complete.");
    process.exit(0);
  }
}

main();
