import { eq, desc } from "drizzle-orm";
import { db, insights, agentInstances } from "@artifigenz/db";
import type { ChatToolDefinition } from "./types";

export const platformTools: ChatToolDefinition[] = [
  {
    name: "getRecentInsights",
    description: "Get recent insights from any or all of the user's agents",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max insights to return (default 10)" },
        agentTypeId: {
          type: "string",
          description: "Filter by agent type (e.g. 'finance')",
        },
      },
    },
    async execute(input, ctx) {
      const limit = (input.limit as number) ?? 10;
      const rows = await db
        .select()
        .from(insights)
        .where(eq(insights.userId, ctx.user.id))
        .orderBy(desc(insights.createdAt))
        .limit(limit);

      return {
        insights: rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          critical: r.isCritical,
          createdAt: r.createdAt,
          read: r.isRead,
        })),
        count: rows.length,
      };
    },
  },

  {
    name: "getAgentStatus",
    description: "Get status and configuration of the user's agents",
    input_schema: {
      type: "object",
      properties: {},
    },
    async execute(_input, ctx) {
      const rows = await db
        .select()
        .from(agentInstances)
        .where(eq(agentInstances.userId, ctx.user.id));

      return {
        agents: rows.map((a) => ({
          id: a.id,
          type: a.agentTypeId,
          status: a.status,
          goal: a.goal,
          lastAnalyzedAt: a.lastAnalyzedAt,
        })),
      };
    },
  },
];
