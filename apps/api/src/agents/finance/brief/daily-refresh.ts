import { desc, eq } from "drizzle-orm";
import { db, financeBriefs } from "@artifigenz/db";
import { phase1FetchAccounts } from "./phases/phase1-accounts";
import { phase2FetchRecurring } from "./phases/phase2-recurring";
import { phase3BuildDigest } from "./phases/phase3-digest";
import type { Digest } from "./helpers/types";
import type { BriefNumber } from "./phases/phase4-llm";

const MIN_DAYS_OF_DATA = 30;

/**
 * Refresh only the numbers + data_scope on the latest Brief, preserving
 * verdict, paragraph, and the LLM-picked phrases. Spec §4.
 *
 * Preserves phrases so voice stays consistent between weekly refreshes — a
 * number that said "thin for your income" on Monday shouldn't silently become
 * just "$420/mo leftover" on Tuesday.
 */
function buildNumbersLocally(
  digest: Digest,
  previous: BriefNumber[],
): BriefNumber[] {
  const income: BriefNumber = {
    value: `$${Math.round(digest.income_monthly).toLocaleString()}/mo income`,
    phrase: previous[0]?.phrase ?? "consistent",
  };
  const leftover: BriefNumber = {
    value: `$${Math.round(digest.leftover_monthly).toLocaleString()}/mo leftover`,
    phrase: previous[1]?.phrase ?? "",
  };
  const recurring: BriefNumber = {
    value: `$${Math.round(digest.recurring_monthly).toLocaleString()}/mo recurring`,
    phrase: previous[2]?.phrase ?? "",
  };

  if (digest.days_of_data >= 60 && digest.accounts_count >= 2) {
    return [income, leftover, recurring];
  }
  return [income, leftover];
}

/**
 * Runs phases 1-3, computes numbers, updates the latest finance_briefs row.
 * If <30 days of data, no-op. If no prior brief, no-op (weekly cron creates
 * the first one).
 */
export async function runDailyNumbersRefresh(
  userId: string,
  agentInstanceId: string,
): Promise<{ updated: boolean; reason?: string }> {
  const accounts = await phase1FetchAccounts(agentInstanceId);
  const recurring = await phase2FetchRecurring(agentInstanceId);
  const digest = await phase3BuildDigest(agentInstanceId, accounts, recurring);

  if (digest.days_of_data < MIN_DAYS_OF_DATA) {
    return { updated: false, reason: "insufficient_data" };
  }

  const [latest] = await db
    .select()
    .from(financeBriefs)
    .where(eq(financeBriefs.userId, userId))
    .orderBy(desc(financeBriefs.generatedAt))
    .limit(1);

  if (!latest) {
    return { updated: false, reason: "no_prior_brief" };
  }

  const previous = (latest.numbers as BriefNumber[]) ?? [];
  const nextNumbers = buildNumbersLocally(digest, previous);

  await db
    .update(financeBriefs)
    .set({
      numbers: nextNumbers,
      dataScope: `Based on ${digest.accounts_count} accounts, ${digest.days_of_data} days.`,
    })
    .where(eq(financeBriefs.id, latest.id));

  return { updated: true };
}
