import { eq } from "drizzle-orm";
import { db, financeTransactions } from "@artifigenz/db";
import { syncTransactionsForInstance } from "./sync-transactions";
import { normalizeToMonthly } from "../helpers/normalize";
import { excludeInternalTransferPairs } from "../helpers/transfers";
import { topNonRecurringMerchants } from "../helpers/merchants";
import { reconstructDailyBalance } from "../helpers/balance";
import { detectRiskFlags } from "../helpers/risk";
import { summarizeStreams } from "../helpers/streams";
import type {
  Digest,
  DigestAccount,
  DigestStream,
  DigestTransaction,
} from "../helpers/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Phase 3 — Sync transactions, load them from DB, run all the math, build the
 * digest. Spec §3.4.
 */
export async function phase3BuildDigest(
  agentInstanceId: string,
  accounts: DigestAccount[],
  recurring: { inflow: DigestStream[]; outflow: DigestStream[] },
): Promise<Digest> {
  // 3.4.1 — sync transactions into the local table first.
  await syncTransactionsForInstance(agentInstanceId);

  const rows = await db
    .select()
    .from(financeTransactions)
    .where(eq(financeTransactions.agentInstanceId, agentInstanceId));

  const transactions: DigestTransaction[] = rows.map((r) => ({
    transactionId: r.plaidTransactionId ?? r.id,
    plaidAccountId: r.plaidAccountId,
    date: r.transactionDate,
    amount: Number(r.amount),
    name: r.description,
    merchantName: r.merchantName,
    pending: r.pending === 1,
    pfcPrimary: r.personalFinanceCategoryPrimary,
    pfcDetailed: r.personalFinanceCategoryDetailed,
  }));

  // 3.4.2 — Compute the five numbers.
  // Plaid's inflow streams have negative average_amount (money in = negative by
  // Plaid's positive-outflow convention), so abs() them to get a positive
  // income figure. Spec pseudocode omits abs() but the Brief presents income
  // as a positive number.
  const incomeMonthly = recurring.inflow.reduce(
    (sum, s) => sum + normalizeToMonthly(Math.abs(s.averageAmount), s.frequency),
    0,
  );

  const recurringMonthly = recurring.outflow.reduce(
    (sum, s) => sum + normalizeToMonthly(Math.abs(s.averageAmount), s.frequency),
    0,
  );

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setUTCDate(today.getUTCDate() - 90);
  const ninetyDaysAgoIso = ninetyDaysAgo.toISOString().slice(0, 10);

  let debits = transactions.filter(
    (t) =>
      t.date >= ninetyDaysAgoIso &&
      t.amount > 0 &&
      !t.pending &&
      t.pfcPrimary !== "TRANSFER_OUT" &&
      t.pfcPrimary !== "LOAN_PAYMENTS",
  );
  debits = excludeInternalTransferPairs(debits, transactions, accounts);

  const expensesMonthly = debits.reduce((sum, t) => sum + t.amount, 0) / 3;
  const leftoverMonthly = incomeMonthly - expensesMonthly;

  let oldest = today;
  for (const t of transactions) {
    const d = new Date(t.date);
    if (d < oldest) oldest = d;
  }
  const daysOfData = transactions.length > 0 ? daysBetween(oldest, today) : 0;

  // 3.4.3 — Build the digest.
  const topMerchants = topNonRecurringMerchants(debits, recurring.outflow, 15);
  const balanceSeries = reconstructDailyBalance(accounts, transactions, 90);
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setUTCDate(today.getUTCDate() - 60);
  const sixtyDaysAgoIso = sixtyDaysAgo.toISOString().slice(0, 10);
  const newRecurringCount = recurring.outflow.filter(
    (s) => s.firstDate !== null && s.firstDate >= sixtyDaysAgoIso,
  ).length;
  const riskFlags = detectRiskFlags(transactions, balanceSeries);

  return {
    income_monthly: round2(incomeMonthly),
    recurring_monthly: round2(recurringMonthly),
    expenses_monthly: round2(expensesMonthly),
    leftover_monthly: round2(leftoverMonthly),
    days_of_data: daysOfData,
    accounts_count: accounts.length,
    iso_currency_code: accounts[0]?.isoCurrencyCode ?? "USD",
    top_merchants: topMerchants,
    balance_series: balanceSeries,
    new_recurring_count: newRecurringCount,
    risk_flags: riskFlags,
    inflow_streams: summarizeStreams(recurring.inflow),
    outflow_streams: summarizeStreams(recurring.outflow),
  };
}
