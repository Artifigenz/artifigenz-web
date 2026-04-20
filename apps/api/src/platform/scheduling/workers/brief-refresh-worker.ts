import { Worker } from "bullmq";
import { and, eq } from "drizzle-orm";
import { db, agentInstances, users } from "@artifigenz/db";
import { getRedisConnection } from "../queues";
import { runDailyNumbersRefresh } from "../../../agents/finance/brief/daily-refresh";
import { runBriefGeneration } from "../../../agents/finance/brief/orchestrator";
import { randomUUID } from "node:crypto";

/**
 * Two job types, keyed on name:
 *   brief:refresh-daily   — fan out to all eligible users, numbers-only update
 *   brief:refresh-weekly  — fan out to all eligible users, full regenerate
 *
 * "Eligible" = onboarding done, has an active finance agent instance.
 */
export function createBriefRefreshWorker() {
  return new Worker(
    "brief_refresh",
    async (job) => {
      const rows = await db
        .select({
          userId: users.id,
          agentInstanceId: agentInstances.id,
        })
        .from(agentInstances)
        .innerJoin(users, eq(users.id, agentInstances.userId))
        .where(
          and(
            eq(agentInstances.agentTypeId, "finance"),
            eq(agentInstances.status, "active"),
            eq(users.onboardingCompleted, true),
          ),
        );

      const jobName = job.name;
      let succeeded = 0;
      let failed = 0;

      for (const { userId, agentInstanceId } of rows) {
        try {
          if (jobName === "brief:refresh-daily") {
            await runDailyNumbersRefresh(userId, agentInstanceId);
          } else if (jobName === "brief:refresh-weekly") {
            // Full refresh — insert a new brief row. generation_id is unused
            // here (no SSE subscriber), but the orchestrator still emits into
            // its Map; the entry expires via the TTL sweeper.
            await runBriefGeneration(userId, agentInstanceId, randomUUID());
          }
          succeeded += 1;
        } catch (err) {
          failed += 1;
          console.error(
            `[BriefRefresh] ${jobName} failed for user ${userId}:`,
            err,
          );
        }
      }

      console.log(
        `[BriefRefresh] ${jobName}: ${succeeded} ok, ${failed} failed`,
      );
      return { succeeded, failed };
    },
    {
      connection: getRedisConnection(),
      concurrency: 1, // one job at a time — each job fans out internally
    },
  );
}
