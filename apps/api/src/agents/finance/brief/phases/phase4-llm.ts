import { db, financeBriefs } from "@artifigenz/db";
import { getClaudeClient } from "../../lib/claude-client";
import { BRIEF_SYSTEM_PROMPT, buildBriefPrompt } from "../prompt";
import type { Digest } from "../helpers/types";

export interface BriefNumber {
  value: string;
  phrase: string;
}

export interface BriefShape {
  verdict: string;
  numbers: BriefNumber[];
  paragraph: string;
  data_scope: string;
}

const BRIEF_MODEL = "claude-opus-4-7";

/**
 * Extract the first JSON object from Claude's response. Claude may wrap JSON
 * in prose or code fences occasionally — this strips safely.
 */
function parseJsonFromResponse(text: string): unknown {
  const trimmed = text.trim();

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fencedMatch) return JSON.parse(fencedMatch[1]);

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  return JSON.parse(trimmed);
}

/**
 * Spec §3.5.1 — throws if the Brief shape is invalid.
 */
function validateBriefShape(b: unknown): asserts b is BriefShape {
  if (!b || typeof b !== "object") throw new Error("Brief must be an object");
  const o = b as Record<string, unknown>;

  if (typeof o.verdict !== "string" || o.verdict.length === 0)
    throw new Error("Brief.verdict must be a non-empty string");

  if (!Array.isArray(o.numbers) || o.numbers.length < 1 || o.numbers.length > 3)
    throw new Error("Brief.numbers must be an array of length 1-3");

  for (const n of o.numbers) {
    if (!n || typeof n !== "object")
      throw new Error("Brief.numbers[] entries must be objects");
    const e = n as Record<string, unknown>;
    if (typeof e.value !== "string" || e.value.length === 0)
      throw new Error("Brief.numbers[].value must be a non-empty string");
    if (typeof e.phrase !== "string" || e.phrase.length === 0)
      throw new Error("Brief.numbers[].phrase must be a non-empty string");
  }

  if (typeof o.paragraph !== "string" || o.paragraph.length === 0)
    throw new Error("Brief.paragraph must be a non-empty string");

  if (typeof o.data_scope !== "string" || o.data_scope.length === 0)
    throw new Error("Brief.data_scope must be a non-empty string");
}

/**
 * Phase 4 — call Claude, parse the JSON response, validate shape, insert the
 * finance_briefs row. Returns the inserted row. Spec §3.5.
 */
export async function phase4GenerateBrief(
  userId: string,
  agentInstanceId: string,
  digest: Digest,
): Promise<{ id: string; brief: BriefShape }> {
  const claude = getClaudeClient();

  const response = await claude.messages.create({
    model: BRIEF_MODEL,
    max_tokens: 1500,
    system: BRIEF_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildBriefPrompt(digest) }],
  });

  const text = response.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("\n")
    .trim();

  if (!text) throw new Error("Empty response from Claude");

  const parsed = parseJsonFromResponse(text);
  validateBriefShape(parsed);

  const [row] = await db
    .insert(financeBriefs)
    .values({
      userId,
      agentInstanceId,
      verdict: parsed.verdict,
      numbers: parsed.numbers,
      paragraph: parsed.paragraph,
      dataScope: parsed.data_scope,
      digestSnapshot: digest as unknown as Record<string, unknown>,
    })
    .returning({ id: financeBriefs.id });

  return { id: row.id, brief: parsed };
}
