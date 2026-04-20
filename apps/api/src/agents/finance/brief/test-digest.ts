/**
 * Test harness for Phases 1–3. Pass an agent_instance_id on argv.
 *
 *   npx tsx src/agents/finance/brief/test-digest.ts <agent_instance_id>
 *
 * Runs against whatever DB the API is pointed at (real Plaid connections
 * needed) and prints the resulting digest JSON. Does NOT call Claude.
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, agentInstances } from "@artifigenz/db";
import { phase1FetchAccounts } from "./phases/phase1-accounts";
import { phase2FetchRecurring } from "./phases/phase2-recurring";
import { phase3BuildDigest } from "./phases/phase3-digest";
import { phase4GenerateBrief } from "./phases/phase4-llm";

async function main() {
  const agentInstanceId = process.argv[2];
  const withBrief = process.argv.includes("--brief");
  if (!agentInstanceId) {
    console.error("Usage: tsx test-digest.ts <agent_instance_id> [--brief]");
    process.exit(1);
  }

  console.log(`\n🔍 Running Brief pipeline for agent instance ${agentInstanceId}\n`);

  const [instance] = await db
    .select({ userId: agentInstances.userId })
    .from(agentInstances)
    .where(eq(agentInstances.id, agentInstanceId))
    .limit(1);
  if (!instance) throw new Error("agent instance not found");

  console.log("Phase 1 — fetching accounts…");
  const accounts = await phase1FetchAccounts(agentInstanceId);
  console.log(`  ✓ ${accounts.length} accounts`);

  console.log("Phase 2 — fetching recurring streams…");
  const recurring = await phase2FetchRecurring(agentInstanceId);
  console.log(
    `  ✓ ${recurring.inflow.length} inflow, ${recurring.outflow.length} outflow`,
  );

  console.log("Phase 3 — building digest…");
  const digest = await phase3BuildDigest(agentInstanceId, accounts, recurring);
  console.log("  ✓ digest built\n");
  console.log(
    `  income=${digest.income_monthly} leftover=${digest.leftover_monthly} recurring=${digest.recurring_monthly} days=${digest.days_of_data} accounts=${digest.accounts_count}\n`,
  );

  if (!withBrief) {
    console.log(JSON.stringify(digest, null, 2));
    process.exit(0);
  }

  console.log("Phase 4 — calling Claude…");
  const { id, brief } = await phase4GenerateBrief(
    instance.userId,
    agentInstanceId,
    digest,
  );
  console.log(`  ✓ brief persisted (id=${id})\n`);

  console.log("\n════════════════ THE BRIEF ════════════════\n");
  console.log("VERDICT  :", brief.verdict);
  console.log();
  for (const n of brief.numbers) {
    console.log(`  ${n.value.padEnd(28)} · ${n.phrase}`);
  }
  console.log();
  console.log(brief.paragraph);
  console.log();
  console.log(brief.data_scope);
  console.log();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
