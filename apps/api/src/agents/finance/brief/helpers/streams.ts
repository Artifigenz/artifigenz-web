import { normalizeToMonthly } from "./normalize";
import type { DigestStream, StreamSummary } from "./types";

/**
 * Compact stream representation for the LLM. Spec §3.4.9.
 */
export function summarizeStreams(streams: DigestStream[]): StreamSummary[] {
  return streams.map((s) => ({
    merchant: s.merchantName ?? s.description ?? "(unknown)",
    amount_monthly:
      Math.round(
        normalizeToMonthly(Math.abs(s.averageAmount), s.frequency) * 100,
      ) / 100,
    frequency: s.frequency,
    last_date: s.lastDate,
  }));
}
