import type { GroupId, TeamMeta } from "../types";
import type { ScheduleEntry } from "../live/liveEngine";
import { GROUPS } from "./groups";

const GROUP_IDS = Object.keys(GROUPS) as GroupId[];

/** Stable numeric id per team (group index * 10 + slot), used across the app. */
function teamId(groupIndex: number, slot: number): number {
  return 1000 + groupIndex * 10 + slot;
}

export const TEAMS: TeamMeta[] = GROUP_IDS.flatMap((group, gi) =>
  GROUPS[group].map((seed, slot) => ({
    id: teamId(gi, slot),
    name: seed.name,
    code: seed.code,
    group,
    fifaRank: seed.fifaRank,
    primary: seed.primary,
    secondary: seed.secondary,
  })),
);

// Round-robin pairings for a 4-team group, by matchday.
const ROUND_ROBIN: [number, number][][] = [
  [[0, 1], [2, 3]], // MD1
  [[0, 2], [3, 1]], // MD2
  [[3, 0], [1, 2]], // MD3
];

/**
 * Group-stage kickoff window. The 12 groups stagger across the first 17 days so
 * matches spread realistically; within a group each matchday is ~5 days apart.
 */
const FIRST_KICKOFF = Date.UTC(2026, 5, 11, 16, 0, 0); // 2026-06-11 16:00 UTC
const DAY = 24 * 60 * 60 * 1000;

function kickoffFor(groupIndex: number, matchday: number, slot: number): string {
  // Spread group's first match over the opening days, then +5 days per matchday.
  const startDay = Math.floor(groupIndex / 2); // two groups share an opening day
  const dayOffset = startDay + matchday * 5;
  const hourSlot = (groupIndex % 2) * 3 + slot * 3; // 0,3 / 3,6 etc.
  return new Date(FIRST_KICKOFF + dayOffset * DAY + hourSlot * 60 * 60 * 1000).toISOString();
}

export const SCHEDULE: ScheduleEntry[] = GROUP_IDS.flatMap((group, gi) => {
  const teams = GROUPS[group];
  const entries: ScheduleEntry[] = [];
  ROUND_ROBIN.forEach((matchday, md) => {
    matchday.forEach(([h, a], slot) => {
      entries.push({
        id: 7000 + gi * 100 + md * 10 + slot,
        group,
        homeName: teams[h].name,
        awayName: teams[a].name,
        kickoffUTC: kickoffFor(gi, md, slot),
      });
    });
  });
  return entries;
});
