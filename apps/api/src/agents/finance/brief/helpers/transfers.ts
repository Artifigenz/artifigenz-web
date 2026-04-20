import type { DigestAccount, DigestTransaction } from "./types";

/**
 * Plaid tags most self-transfers with TRANSFER_OUT, but misses some Zelle-style
 * transfers between two connected banks. Pair them manually on amount + date
 * proximity. Spec §3.4.5.
 */
export function excludeInternalTransferPairs(
  debits: DigestTransaction[],
  allTransactions: DigestTransaction[],
  accounts: DigestAccount[],
): DigestTransaction[] {
  const userAccountIds = new Set(accounts.map((a) => a.plaidAccountId));
  const credits = allTransactions.filter(
    (t) =>
      t.amount < 0 &&
      t.plaidAccountId !== null &&
      userAccountIds.has(t.plaidAccountId) &&
      !t.pending,
  );

  const excluded = new Set<string>();
  for (const debit of debits) {
    for (const credit of credits) {
      if (debit.plaidAccountId === credit.plaidAccountId) continue;
      if (Math.abs(debit.amount) !== Math.abs(credit.amount)) continue;
      const daysApart = Math.abs(
        (new Date(debit.date).getTime() - new Date(credit.date).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysApart > 3) continue;
      excluded.add(debit.transactionId);
      break;
    }
  }

  return debits.filter((t) => !excluded.has(t.transactionId));
}
