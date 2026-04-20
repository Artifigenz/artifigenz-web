/**
 * Converts a recurring-stream amount into monthly terms using Plaid's frequency enum.
 * Spec §3.4.4.
 */
export function normalizeToMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case "WEEKLY":
      return amount * 4.33;
    case "BIWEEKLY":
      return amount * 2.17;
    case "SEMI_MONTHLY":
      return amount * 2;
    case "MONTHLY":
      return amount;
    case "ANNUALLY":
      return amount / 12;
    case "UNKNOWN":
    default:
      return amount;
  }
}
