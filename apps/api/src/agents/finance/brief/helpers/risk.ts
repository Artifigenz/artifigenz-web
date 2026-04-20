import type { BalancePoint, DigestTransaction, RiskFlags } from "./types";

/**
 * Spec §3.4.8.
 */
export function detectRiskFlags(
  transactions: DigestTransaction[],
  balanceSeries: BalancePoint[],
): RiskFlags {
  const negativeBalanceDays = balanceSeries.filter((d) => d.balance < 0).length;

  const nsfCount = transactions.filter((t) => {
    const name = (t.name ?? "").toLowerCase();
    if ((t.pfcDetailed ?? "").includes("BANK_FEES_OVERDRAFT")) return true;
    if (name.includes("overdraft")) return true;
    if (name.includes("nsf")) return true;
    if (name.includes("insufficient funds")) return true;
    return false;
  }).length;

  return {
    negative_balance_days: negativeBalanceDays,
    nsf_count: nsfCount,
  };
}
