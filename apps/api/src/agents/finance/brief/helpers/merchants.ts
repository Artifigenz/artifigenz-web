import type { DigestStream, DigestTransaction, TopMerchant } from "./types";

/**
 * Top N non-recurring merchants by total spend over the window. Spec §3.4.6.
 */
export function topNonRecurringMerchants(
  debits: DigestTransaction[],
  outflowStreams: DigestStream[],
  limit: number,
): TopMerchant[] {
  const recurringNames = new Set(
    outflowStreams
      .map((s) => (s.merchantName ?? s.description ?? "").toLowerCase())
      .filter(Boolean),
  );

  const nonRecurring = debits.filter((t) => {
    const key = (t.merchantName ?? t.name ?? "").toLowerCase();
    return key.length > 0 && !recurringNames.has(key);
  });

  const grouped = new Map<string, TopMerchant>();
  for (const tx of nonRecurring) {
    const key = tx.merchantName ?? tx.name;
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
      existing.total += tx.amount;
    } else {
      grouped.set(key, { merchant: key, count: 1, total: tx.amount });
    }
  }

  return Array.from(grouped.values())
    .map((m) => ({ ...m, total: Math.round(m.total * 100) / 100 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
