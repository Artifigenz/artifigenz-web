/**
 * In-memory pub/sub for Brief generation progress events.
 *
 * Single-process — keyed by generation_id. Good enough for our single-replica
 * Railway deploy. If we ever scale horizontally, swap the Map for Redis pub/sub.
 *
 * Events are buffered from the moment a generation starts until a subscriber
 * attaches, so the frontend can't miss phase-1-progress even if it connects
 * a few milliseconds after POST /generate returns.
 */

export type BriefEvent =
  | { type: "progress"; phase: 1 | 2 | 3 | 4 }
  | { type: "complete"; brief_id: string }
  | { type: "insufficient_data"; days_available: number; min_required: number }
  | { type: "error"; message: string };

interface GenerationState {
  buffered: BriefEvent[];
  subscribers: Array<(event: BriefEvent) => void>;
  closed: boolean;
  createdAt: number;
}

const generations = new Map<string, GenerationState>();

const TTL_MS = 5 * 60 * 1000; // 5min after close — enough for slow reconnects

setInterval(() => {
  const now = Date.now();
  for (const [id, state] of generations) {
    if (state.closed && now - state.createdAt > TTL_MS) generations.delete(id);
  }
}, 60_000).unref();

export function createGeneration(id: string): void {
  generations.set(id, {
    buffered: [],
    subscribers: [],
    closed: false,
    createdAt: Date.now(),
  });
}

export function emit(id: string, event: BriefEvent): void {
  const state = generations.get(id);
  if (!state) return;
  if (state.subscribers.length === 0) {
    state.buffered.push(event);
  } else {
    for (const sub of state.subscribers) sub(event);
  }
  if (
    event.type === "complete" ||
    event.type === "error" ||
    event.type === "insufficient_data"
  ) {
    state.closed = true;
  }
}

/**
 * Subscribe and drain any buffered events. Returns an unsubscribe function.
 */
export function subscribe(
  id: string,
  handler: (event: BriefEvent) => void,
): () => void {
  const state = generations.get(id);
  if (!state) {
    handler({ type: "error", message: "Unknown generation id" });
    return () => {};
  }
  for (const e of state.buffered) handler(e);
  state.buffered = [];
  state.subscribers.push(handler);
  return () => {
    const idx = state.subscribers.indexOf(handler);
    if (idx >= 0) state.subscribers.splice(idx, 1);
  };
}

export function isClosed(id: string): boolean {
  return generations.get(id)?.closed ?? true;
}
