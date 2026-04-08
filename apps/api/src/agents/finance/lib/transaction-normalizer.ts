/**
 * Normalizes merchant names for grouping.
 *
 * Raw bank descriptions vary wildly:
 *   "NETFLIX.COM 866-579-7172 CA"
 *   "NETFLIX COM NETFLIX.COM"
 *   "NETFLIX.COM            CA"
 * All of these should collapse to "netflix".
 */
export function normalizeMerchant(input: string | null): string {
  if (!input) return "";

  // If the input already looks clean (Title Case, no noise), just lowercase it.
  // A "clean" merchant name has no special chars, no long digits, and reasonable length.
  const looksClean =
    /^[A-Za-z][A-Za-z0-9 &'-]{1,40}$/.test(input.trim()) &&
    !/\d{4,}/.test(input); // no long digit sequences
  if (looksClean) {
    return input.trim().toLowerCase();
  }

  // Otherwise, aggressively normalize a raw bank description.
  return (
    input
      .toLowerCase()
      // Remove common payment processor prefixes
      .replace(/^(sq\s*\*|sp\s*\*|py\s*\*|tst\s*\*|pp\s*\*)/i, "")
      // Remove phone numbers
      .replace(/\d{3}[-.]?\d{3}[-.]?\d{4}/g, "")
      // Remove domain extensions
      .replace(/\.(com|net|org|io|co|app|ai)\b/g, "")
      // Remove state codes (2 letters at end)
      .replace(/\s+[a-z]{2}\s*$/, "")
      // Remove everything that's not a letter or number
      .replace(/[^a-z0-9\s]/g, " ")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
      // Take the first few meaningful tokens
      .split(" ")
      .filter((t) => t.length >= 2)
      .slice(0, 2)
      .join(" ")
  );
}

/**
 * Returns the number of days between two ISO date strings.
 */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round(Math.abs(db - da) / (1000 * 60 * 60 * 24));
}

/**
 * Adds days to an ISO date string and returns the new ISO date.
 */
export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
