import { phase1FetchAccounts } from "./phases/phase1-accounts";
import { phase2FetchRecurring } from "./phases/phase2-recurring";
import { phase3BuildDigest } from "./phases/phase3-digest";
import { phase4GenerateBrief } from "./phases/phase4-llm";
import { emit } from "./events";

const MIN_DAYS_OF_DATA = 30;

/**
 * Spec §3.1 — runs the four phases, emitting progress per phase. On insufficient
 * data, emits insufficient_data and stops. Errors are caught and emitted as
 * error events so the SSE consumer can render them.
 */
export async function runBriefGeneration(
  userId: string,
  agentInstanceId: string,
  generationId: string,
): Promise<void> {
  try {
    const accounts = await phase1FetchAccounts(agentInstanceId);
    emit(generationId, { type: "progress", phase: 1 });

    const recurring = await phase2FetchRecurring(agentInstanceId);
    emit(generationId, { type: "progress", phase: 2 });

    const digest = await phase3BuildDigest(agentInstanceId, accounts, recurring);
    emit(generationId, { type: "progress", phase: 3 });

    if (digest.days_of_data < MIN_DAYS_OF_DATA) {
      emit(generationId, {
        type: "insufficient_data",
        days_available: digest.days_of_data,
        min_required: MIN_DAYS_OF_DATA,
      });
      // Spec §2.4 mentions a 24h retry cron — that lives in the scheduler,
      // not in this orchestrator.
      return;
    }

    const { id: briefId } = await phase4GenerateBrief(
      userId,
      agentInstanceId,
      digest,
    );
    emit(generationId, { type: "progress", phase: 4 });
    emit(generationId, { type: "complete", brief_id: briefId });
  } catch (err) {
    console.error(`[Brief/orchestrator] generation ${generationId} failed:`, err);
    emit(generationId, {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
