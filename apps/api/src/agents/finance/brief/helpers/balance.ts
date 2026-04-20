import type { BalancePoint, DigestAccount, DigestTransaction } from "./types";

/**
 * Walk backwards from the known net position reversing each transaction,
 * producing a daily balance series (oldest first). Spec §3.4.7.
 */
export function reconstructDailyBalance(
  accounts: DigestAccount[],
  transactions: DigestTransaction[],
  days: number,
): BalancePoint[] {
  const depositoryIds = new Set(
    accounts.filter((a) => a.type === "depository").map((a) => a.plaidAccountId),
  );
  const creditIds = new Set(
    accounts.filter((a) => a.type === "credit").map((a) => a.plaidAccountId),
  );

  const depositoryTotal = accounts
    .filter((a) => a.type === "depository")
    .reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);
  const creditTotal = accounts
    .filter((a) => a.type === "credit")
    .reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);

  const netNow = depositoryTotal - creditTotal;

  const byDay = new Map<string, DigestTransaction[]>();
  for (const tx of transactions) {
    if (tx.pending) continue;
    const list = byDay.get(tx.date) ?? [];
    list.push(tx);
    byDay.set(tx.date, list);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const series: BalancePoint[] = [];
  let running = netNow;

  for (let i = 0; i <= days; i += 1) {
    const day = new Date(today);
    day.setUTCDate(today.getUTCDate() - i);
    const iso = day.toISOString().slice(0, 10);
    const dayTxns = byDay.get(iso) ?? [];

    for (const t of dayTxns) {
      if (!t.plaidAccountId) continue;
      if (depositoryIds.has(t.plaidAccountId)) {
        running += t.amount; // reverse: outflow (amount > 0) adds back
      } else if (creditIds.has(t.plaidAccountId)) {
        running -= t.amount;
      }
    }

    series.push({ date: iso, balance: Math.round(running * 100) / 100 });
  }

  return series.reverse(); // oldest first
}
