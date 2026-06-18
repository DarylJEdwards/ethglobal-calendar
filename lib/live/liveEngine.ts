import type { GroupId, MatchEvent, RawFixture, TeamMeta } from "../types";

/** One scheduled group-stage match (static schedule data). */
export interface ScheduleEntry {
  id: number;
  group: GroupId;
  homeName: string;
  awayName: string;
  kickoffUTC: string;
  venue?: string;
}

/** Deterministic PRNG (mulberry32) so a fixture always simulates identically. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REGULATION_MINUTES = 94; // 90 + stoppage
const MATCH_WALL_MINUTES = 115; // include half-time + buffer before marking FT

/** Plausible final score weighted toward low-scoring outcomes. */
function drawGoals(rand: () => number): number {
  const r = rand();
  if (r < 0.3) return 0;
  if (r < 0.62) return 1;
  if (r < 0.84) return 2;
  if (r < 0.95) return 3;
  return 4;
}

function buildEvents(
  homeId: number,
  awayId: number,
  homeGoals: number,
  awayGoals: number,
  upToMinute: number,
  rand: () => number,
): { events: MatchEvent[]; shownHome: number; shownAway: number } {
  const minutesFor = (n: number): number[] =>
    Array.from({ length: n }, () => 1 + Math.floor(rand() * REGULATION_MINUTES)).sort(
      (a, b) => a - b,
    );

  const events: MatchEvent[] = [];
  let shownHome = 0;
  let shownAway = 0;
  for (const min of minutesFor(homeGoals)) {
    if (min <= upToMinute) {
      events.push({ minute: min, teamId: homeId, type: "goal" });
      shownHome++;
    }
  }
  for (const min of minutesFor(awayGoals)) {
    if (min <= upToMinute) {
      events.push({ minute: min, teamId: awayId, type: "goal" });
      shownAway++;
    }
  }
  // A couple of cards for fair-play colour.
  const cards = Math.floor(rand() * 4);
  for (let i = 0; i < cards; i++) {
    const min = 10 + Math.floor(rand() * (REGULATION_MINUTES - 10));
    if (min > upToMinute) continue;
    const teamId = rand() < 0.5 ? homeId : awayId;
    events.push({ minute: min, teamId, type: rand() < 0.85 ? "yellow" : "red" });
  }
  events.sort((a, b) => a.minute - b.minute);
  return { events, shownHome, shownAway };
}

/**
 * Simulate one fixture's state as of `now`, deterministically. NS before
 * kickoff, LIVE with a progressing scoreline during the match window, FT after.
 */
export function simulateFixture(
  entry: ScheduleEntry,
  teamsByName: Map<string, TeamMeta>,
  now: number,
): RawFixture {
  const home = teamsByName.get(entry.homeName);
  const away = teamsByName.get(entry.awayName);
  const homeRef = home
    ? { id: home.id, name: home.name, code: home.code }
    : { id: hashName(entry.homeName), name: entry.homeName, code: "xx" };
  const awayRef = away
    ? { id: away.id, name: away.name, code: away.code }
    : { id: hashName(entry.awayName), name: entry.awayName, code: "xx" };

  const kickoff = new Date(entry.kickoffUTC).getTime();
  const minutesIn = (now - kickoff) / 60000;
  const rand = rng(entry.id * 2654435761);
  const finalHome = drawGoals(rand);
  const finalAway = drawGoals(rand);

  const base: RawFixture = {
    id: entry.id,
    group: entry.group,
    kickoff: entry.kickoffUTC,
    status: "NS",
    elapsed: null,
    home: homeRef,
    away: awayRef,
    goals: { home: null, away: null },
    venue: entry.venue,
  };

  if (minutesIn < 0) return base; // not started

  if (minutesIn >= MATCH_WALL_MINUTES) {
    const { events } = buildEvents(homeRef.id, awayRef.id, finalHome, finalAway, REGULATION_MINUTES, rng(entry.id * 2654435761 + 1));
    return {
      ...base,
      status: "FT",
      elapsed: 90,
      goals: { home: finalHome, away: finalAway },
      events,
    };
  }

  // LIVE: clamp the on-pitch clock and reveal goals scored so far.
  const elapsed = Math.min(REGULATION_MINUTES, Math.max(1, Math.floor(minutesIn)));
  const { events, shownHome, shownAway } = buildEvents(
    homeRef.id,
    awayRef.id,
    finalHome,
    finalAway,
    elapsed,
    rng(entry.id * 2654435761 + 1),
  );
  const half = elapsed >= 45 && elapsed <= 48 && minutesIn < 60;
  return {
    ...base,
    status: half ? "HT" : "LIVE",
    elapsed: half ? 45 : elapsed,
    goals: { home: shownHome, away: shownAway },
    events,
  };
}

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  return Math.abs(h) % 1_000_000 + 900_000;
}

/** Simulate the whole schedule as of `now`. */
export function simulateSchedule(
  schedule: ScheduleEntry[],
  teams: TeamMeta[],
  now: number,
): RawFixture[] {
  const byName = new Map<string, TeamMeta>();
  for (const t of teams) byName.set(t.name, t);
  return schedule.map((e) => simulateFixture(e, byName, now));
}
