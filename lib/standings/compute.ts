import {
  GROUP_IDS,
  type GroupId,
  type GroupTable,
  type RawFixture,
  type TeamMeta,
  type TeamRow,
  type ThirdPlaceRank,
} from "../types";
import { compareThirds, isFinished, isLive, rankGroup } from "./tiebreakers";

/** Disciplinary penalty weights for the fair-play tiebreak (lower is better). */
const YELLOW_PTS = 1;
const RED_PTS = 4;

function emptyRow(meta: TeamMeta): TeamRow {
  return {
    team: { id: meta.id, name: meta.name, code: meta.code },
    group: meta.group,
    played: 0, win: 0, draw: 0, loss: 0,
    gf: 0, ga: 0, gd: 0, points: 0,
    yellow: 0, red: 0, disciplinary: 0,
    fifaRank: meta.fifaRank,
    primary: meta.primary,
    secondary: meta.secondary,
    rankInGroup: 0,
    outcome: "fourth",
    qualification: "active",
  };
}

function applyFixture(
  row: TeamRow,
  forGoals: number,
  againstGoals: number,
): void {
  row.played += 1;
  row.gf += forGoals;
  row.ga += againstGoals;
  row.gd = row.gf - row.ga;
  if (forGoals > againstGoals) {
    row.win += 1;
    row.points += 3;
  } else if (forGoals < againstGoals) {
    row.loss += 1;
  } else {
    row.draw += 1;
    row.points += 1;
  }
}

function applyDiscipline(rowsById: Map<number, TeamRow>, f: RawFixture): void {
  if (!f.events) return;
  for (const ev of f.events) {
    const row = rowsById.get(ev.teamId);
    if (!row) continue;
    if (ev.type === "yellow") {
      row.yellow += 1;
      row.disciplinary += YELLOW_PTS;
    } else if (ev.type === "red") {
      row.red += 1;
      row.disciplinary += RED_PTS;
    }
  }
}

/**
 * Build the raw (unsorted) stat rows for one group from its fixtures.
 * @param includeLive when true, in-play scores count toward a provisional table.
 */
export function buildGroupRows(
  group: GroupId,
  teams: TeamMeta[],
  fixtures: RawFixture[],
  includeLive: boolean,
): TeamRow[] {
  const rowsById = new Map<number, TeamRow>();
  for (const t of teams) rowsById.set(t.id, emptyRow(t));

  for (const f of fixtures) {
    if (f.group !== group) continue;
    const counts = isFinished(f) || (includeLive && isLive(f));
    if (!counts) continue;
    const home = rowsById.get(f.home.id);
    const away = rowsById.get(f.away.id);
    if (!home || !away) continue;
    const hg = f.goals.home ?? 0;
    const ag = f.goals.away ?? 0;
    applyFixture(home, hg, ag);
    applyFixture(away, ag, hg);
    applyDiscipline(rowsById, f);
  }
  return [...rowsById.values()];
}

const OUTCOMES = ["winner", "runnerUp", "third", "fourth"] as const;

/** Compute every group table, sorted and annotated, but without cross-group thirds state. */
export function computeGroupTables(
  teamsByGroup: Record<GroupId, TeamMeta[]>,
  fixtures: RawFixture[],
  includeLive = false,
): GroupTable[] {
  return GROUP_IDS.map((group) => {
    const rows = buildGroupRows(group, teamsByGroup[group] ?? [], fixtures, includeLive);
    const sorted = rankGroup(rows, fixtures);
    const groupFixtures = fixtures.filter((f) => f.group === group);
    const finishedCount = groupFixtures.filter(isFinished).length;
    const complete = finishedCount >= 6 && sorted.every((r) => r.played >= 3);

    sorted.forEach((row, idx) => {
      row.rankInGroup = idx + 1;
      row.outcome = OUTCOMES[idx] ?? "fourth";
      // Provisional qualification; thirds refined later in applyThirdsState().
      if (idx <= 1) {
        row.qualification = complete ? "advanced" : "advancing";
      } else if (idx === 2) {
        row.qualification = "thirdOut"; // refined by applyThirdsState
      } else {
        row.qualification = complete ? "eliminated" : "active";
      }
    });

    return { group, rows: sorted, complete, playedCount: finishedCount };
  });
}

/** Rank the 12 third-placed teams and mark the 8 that qualify. */
export function rankThirds(tables: GroupTable[]): ThirdPlaceRank {
  const thirds = tables
    .map((t) => t.rows[2])
    .filter((r): r is TeamRow => Boolean(r))
    .sort(compareThirds);

  const qualifyingGroups = thirds.slice(0, 8).map((r) => r.group);
  return { rows: thirds, qualifyingGroups };
}

/** Refine third-place rows' qualification state using the cross-group ranking. */
export function applyThirdsState(
  tables: GroupTable[],
  thirds: ThirdPlaceRank,
): void {
  const qualifying = new Set(thirds.qualifyingGroups);
  for (const table of tables) {
    const third = table.rows[2];
    if (!third) continue;
    third.qualification = qualifying.has(third.group)
      ? table.complete ? "advanced" : "thirdIn"
      : table.complete ? "eliminated" : "thirdOut";
  }
}

export { isFinished, isLive };
