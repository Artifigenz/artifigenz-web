import type { DataSourceTypeDefinition } from "../../../platform/registry/types";

/**
 * Plaid adapter — stub implementation.
 *
 * Full implementation requires:
 *   - PLAID_CLIENT_ID, PLAID_SECRET env vars
 *   - /transactions/sync cursor handling
 *   - Webhook signature verification
 *
 * Will be built out once Plaid credentials are available.
 */
export const plaidAdapter: DataSourceTypeDefinition = {
  typeId: "plaid",
  name: "Bank Account (Plaid)",
  description: "Connect your bank accounts securely via Plaid",
  connectionFlow: "sdk",
  syncMechanism: "webhook",

  async getConnectionConfig() {
    throw new Error("Plaid adapter not yet implemented — requires PLAID_CLIENT_ID");
  },

  async finalizeConnection() {
    throw new Error("Plaid adapter not yet implemented");
  },

  async testConnection() {
    return false;
  },

  async disconnect() {
    // no-op
  },

  async sync() {
    return [];
  },

  async handleWebhook() {
    return { connectionId: "", action: "none" };
  },
};
