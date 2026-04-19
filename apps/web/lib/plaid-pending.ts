/**
 * Plaid OAuth handoff state — stashed in localStorage before opening Plaid Link
 * so the /plaid/oauth page can pick up the linkToken + agentInstanceId after
 * the bank redirects the browser back.
 */

const KEY = 'artifigenz_plaid_pending';

export interface PlaidPending {
  linkToken: string;
  agentInstanceId: string;
  returnTo: string;
}

export function savePlaidPending(pending: PlaidPending) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(pending));
  } catch {}
}

export function readPlaidPending(): PlaidPending | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.linkToken === 'string' &&
      typeof parsed.agentInstanceId === 'string' &&
      typeof parsed.returnTo === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPlaidPending() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}
