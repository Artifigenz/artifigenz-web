import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  type PlaidError,
} from "plaid";

let client: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (client) return client;

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = process.env.PLAID_ENV ?? "sandbox";

  if (!clientId || !secret) {
    throw new Error("PLAID_CLIENT_ID and PLAID_SECRET must be set");
  }

  const config = new Configuration({
    basePath:
      PlaidEnvironments[env as keyof typeof PlaidEnvironments] ??
      PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  client = new PlaidApi(config);
  return client;
}

export function isPlaidError(err: unknown): err is { response: { data: PlaidError } } {
  return (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: unknown }).response === "object"
  );
}
