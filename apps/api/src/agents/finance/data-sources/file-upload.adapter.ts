import type { DataSourceTypeDefinition } from "../../../platform/registry/types";

/**
 * File upload adapter — stub implementation.
 *
 * Full implementation requires:
 *   - ANTHROPIC_API_KEY for Claude statement parsing
 *   - Supabase Storage or S3 for file persistence
 *
 * Will be built out once Claude API key is available.
 */
export const fileUploadAdapter: DataSourceTypeDefinition = {
  typeId: "file-upload",
  name: "Bank Statement Upload",
  description: "Upload bank statements (PDF, CSV, Excel) for analysis",
  connectionFlow: "file_upload",
  syncMechanism: "manual",

  async getConnectionConfig() {
    throw new Error("File upload adapter not yet implemented — requires ANTHROPIC_API_KEY");
  },

  async finalizeConnection() {
    throw new Error("File upload adapter not yet implemented");
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
};
