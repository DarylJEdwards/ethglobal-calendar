import { ApiFootballAdapter, RateLimitError } from "../adapter/apiFootball";
import { getConfig, selectAdapter, type RuntimeConfig } from "../adapter";
import { SimulatedAdapter } from "../adapter/simulated";
import { TEAMS } from "../data";
import { buildPayload } from "../payload";
import type { AdapterResult, StaleReason, TournamentPhase, WorldCupPayload } from "../types";

// Base upstream refresh interval per tournament phase (ms). The governor only
// ever widens these, never narrows them.
const BASE_TTL: Record<TournamentPhase, number> = {
  live: 300_000, // 5 min
  "matchday-idle": 600_000, // 10 min
  off: 3_600_000, // 1 hr
  pre: 3_600_000, // 1 hr
};

const ERROR_BACKOFF = 120_000; // wait 2 min after an upstream error before retry

interface CacheState {
  last: AdapterResult | null;
  inFlight: Promise<void> | null;
  dayKey: string;
  dayCount: number;
  blockedUntil: number;
}

// Persist across hot reloads / reused serverless invocations.
const g = globalThis as unknown as { __wcCache?: CacheState };
const state: CacheState =
  g.__wcCache ??
  (g.__wcCache = { last: null, inFlight: null, dayKey: "", dayCount: 0, blockedUntil: 0 });

function utcDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function rolloverBudget(now: number): void {
  const key = utcDayKey(now);
  if (state.dayKey !== key) {
    state.dayKey = key;
    state.dayCount = 0;
  }
}

/** Effective TTL: widen the base interval so we never exceed the daily budget. */
function effectiveTtl(phase: TournamentPhase, cfg: RuntimeConfig, now: number): number {
  const base = BASE_TTL[phase];
  const remaining = Math.max(1, cfg.dailyBudget - state.dayCount);
  const endOfDay = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate() + 1,
  );
  const secondsLeft = Math.max(1, (endOfDay - now) / 1000);
  const governed = (secondsLeft / remaining) * 1000;
  return Math.max(base, governed);
}

async function refresh(cfg: RuntimeConfig): Promise<void> {
  const now = Date.now();
  rolloverBudget(now);
  const adapter = selectAdapter(cfg);
  if (adapter.kind === "simulated") {
    state.last = await adapter.getFixtures();
    return;
  }
  try {
    state.dayCount += 1;
    const result = await (adapter as ApiFootballAdapter).getFixtures();
    state.last = result;
    state.blockedUntil = 0;
  } catch (err) {
    const reason: StaleReason = err instanceof RateLimitError ? "rate-limit" : "upstream-error";
    // Rate-limited: stop calling until the daily quota resets (next UTC day).
    state.blockedUntil =
      reason === "rate-limit"
        ? Date.UTC(
            new Date(now).getUTCFullYear(),
            new Date(now).getUTCMonth(),
            new Date(now).getUTCDate() + 1,
          )
        : now + ERROR_BACKOFF;
    if (state.last) {
      state.last = { ...state.last, staleReason: reason };
    } else {
      // No good data yet — fall back to simulated so the UI is never empty.
      state.last = await new SimulatedAdapter(reason).getFixtures();
    }
  }
}

function buildFrom(result: AdapterResult): WorldCupPayload {
  return buildPayload(TEAMS, result.fixtures, {
    source: result.source,
    fetchedAt: result.fetchedAt,
    staleReason:
      result.staleReason ??
      (result.source === "simulated" ? noKeyReason() : undefined),
  });
}

function noKeyReason(): StaleReason | undefined {
  const cfg = getConfig();
  if (cfg.forceSimulated) return "forced";
  if (!cfg.key) return "no-key";
  return undefined;
}

/**
 * Return the current payload, triggering a single background refresh when the
 * cache is stale (stale-while-revalidate). Many clients are served from one
 * upstream fetch; the budget governor keeps us under the free-tier daily cap.
 */
export async function getPayload(): Promise<WorldCupPayload> {
  const cfg = getConfig();
  const now = Date.now();
  rolloverBudget(now);

  // Cold start: must fetch before we can answer.
  if (!state.last) {
    state.inFlight ??= refresh(cfg).finally(() => (state.inFlight = null));
    await state.inFlight;
  }

  const payload = buildFrom(state.last!);

  const usingApi = !cfg.forceSimulated && Boolean(cfg.key);
  const ttl = effectiveTtl(payload.meta.phase, cfg, now);
  const stale = now - state.last!.fetchedAt > ttl;
  const budgetLeft = cfg.dailyBudget - state.dayCount > 0;
  const unblocked = now >= state.blockedUntil;

  if (usingApi && stale && budgetLeft && unblocked && !state.inFlight) {
    // Fire-and-forget background refresh; current request returns immediately.
    state.inFlight = refresh(cfg).finally(() => (state.inFlight = null));
  }

  return payload;
}

/** Suggested CDN s-maxage (seconds) for the current phase. */
export function cacheSeconds(phase: TournamentPhase): number {
  return phase === "live" ? 20 : 60;
}
