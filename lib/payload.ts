import { buildBracket } from "./standings/bracket";
import {
  applyThirdsState,
  computeGroupTables,
  isFinished,
  isLive,
  rankThirds,
} from "./standings/compute";
import {
  type GroupId,
  type RawFixture,
  type TeamMeta,
  type TournamentPhase,
  type WorldCupPayload,
} from "./types";

function groupTeams(teams: TeamMeta[]): Record<GroupId, TeamMeta[]> {
  const out = {} as Record<GroupId, TeamMeta[]>;
  for (const t of teams) {
    (out[t.group] ??= []).push(t);
  }
  return out;
}

function detectPhase(fixtures: RawFixture[], now: number): TournamentPhase {
  if (fixtures.some(isLive)) return "live";
  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date(now).toISOString().slice(0, 10);
  const hasToday = fixtures.some((f) => f.kickoff.slice(0, 10) === today);
  if (hasToday) return "matchday-idle";
  const anyUpcoming = fixtures.some(
    (f) => !isFinished(f) && new Date(f.kickoff).getTime() > now,
  );
  if (!anyUpcoming && fixtures.some(isFinished)) return "off";
  // If the nearest upcoming kickoff is within 6h, treat as matchday-idle.
  const soon = fixtures
    .filter((f) => !isFinished(f) && new Date(f.kickoff).getTime() > now)
    .map((f) => new Date(f.kickoff).getTime() - now)
    .sort((a, b) => a - b)[0];
  if (soon !== undefined && soon < 6 * 60 * 60 * 1000) return "matchday-idle";
  return fixtures.some(isFinished) ? "off" : "pre";
}

/**
 * Assemble the full client payload from raw fixtures + static team metadata.
 * Pure and deterministic given (teams, fixtures, now).
 */
export function buildPayload(
  teams: TeamMeta[],
  fixtures: RawFixture[],
  opts: {
    source: WorldCupPayload["meta"]["source"];
    fetchedAt: number;
    staleReason?: WorldCupPayload["meta"]["staleReason"];
    now?: number;
    includeLiveInTable?: boolean;
  },
): WorldCupPayload {
  const now = opts.now ?? Date.now();
  const byGroup = groupTeams(teams);

  const groups = computeGroupTables(byGroup, fixtures, opts.includeLiveInTable ?? false);
  const thirds = rankThirds(groups);
  applyThirdsState(groups, thirds);
  const { slots: bracket, approximate } = buildBracket(groups, thirds);

  const liveFixtures = fixtures
    .filter(isLive)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  const upcomingFixtures = fixtures
    .filter((f) => !isFinished(f) && !isLive(f))
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    .slice(0, 12);

  const recentFixtures = fixtures
    .filter(isFinished)
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff))
    .slice(0, 12);

  const nextKickoff = fixtures
    .filter((f) => new Date(f.kickoff).getTime() > now && !isFinished(f))
    .map((f) => f.kickoff)
    .sort()[0];

  return {
    groups,
    thirds,
    bracket,
    bracketApproximate: approximate,
    liveFixtures,
    upcomingFixtures,
    recentFixtures,
    meta: {
      source: opts.source,
      fetchedAt: opts.fetchedAt,
      staleReason: opts.staleReason,
      phase: detectPhase(fixtures, now),
      nextKickoff,
      serverTime: now,
    },
  };
}
