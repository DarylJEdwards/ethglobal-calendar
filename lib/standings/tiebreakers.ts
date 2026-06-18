import type { RawFixture, TeamRow } from "../types";

/** A match counts toward the table once it has a final result. */
export function isFinished(f: RawFixture): boolean {
  return f.status === "FT" || f.status === "AET" || f.status === "PEN";
}

/** A match is in play. */
export function isLive(f: RawFixture): boolean {
  return f.status === "LIVE" || f.status === "HT";
}

interface MiniStat {
  points: number;
  gd: number;
  gf: number;
}

/**
 * Head-to-head mini-table over the matches played strictly between the given
 * subset of teams. Returns points / goal difference / goals scored per team id.
 */
function headToHead(
  subset: Set<number>,
  fixtures: RawFixture[],
): Map<number, MiniStat> {
  const stat = new Map<number, MiniStat>();
  for (const id of subset) stat.set(id, { points: 0, gd: 0, gf: 0 });

  for (const f of fixtures) {
    if (!isFinished(f)) continue;
    const h = f.home.id;
    const a = f.away.id;
    if (!subset.has(h) || !subset.has(a)) continue;
    const hg = f.goals.home ?? 0;
    const ag = f.goals.away ?? 0;
    const hs = stat.get(h)!;
    const as = stat.get(a)!;
    hs.gf += hg;
    hs.gd += hg - ag;
    as.gf += ag;
    as.gd += ag - hg;
    if (hg > ag) hs.points += 3;
    else if (ag > hg) as.points += 3;
    else {
      hs.points += 1;
      as.points += 1;
    }
  }
  return stat;
}

/** Ordered comparison helpers. Each returns >0 if a ranks above b, <0 below, 0 tie. */
type Cmp = (a: TeamRow, b: TeamRow) => number;

const byOverall: { label: string; cmp: Cmp }[] = [
  { label: "goal difference", cmp: (a, b) => a.gd - b.gd },
  { label: "goals scored", cmp: (a, b) => a.gf - b.gf },
  // Fewer disciplinary points ranks HIGHER, so invert.
  { label: "fair play", cmp: (a, b) => b.disciplinary - a.disciplinary },
  // Lower FIFA ranking number is better, so invert.
  { label: "FIFA ranking", cmp: (a, b) => b.fifaRank - a.fifaRank },
];

/**
 * Resolve a cluster of teams that are level on total points, following the
 * FIFA 2026 order: head-to-head (points, GD, goals) re-applied to any still-tied
 * sub-group, then overall GD, overall goals, fair play, FIFA ranking.
 *
 * Mutates each row's `decidedBy` and returns the cluster best-first.
 */
function resolveCluster(
  cluster: TeamRow[],
  fixtures: RawFixture[],
  depth = 0,
): TeamRow[] {
  if (cluster.length <= 1) return cluster;

  // Phase A: head-to-head among exactly this cluster.
  const ids = new Set(cluster.map((r) => r.team.id));
  const h2h = headToHead(ids, fixtures);
  const h2hCmp: { label: string; cmp: Cmp }[] = [
    { label: "head-to-head points", cmp: (a, b) => h2h.get(a.team.id)!.points - h2h.get(b.team.id)!.points },
    { label: "head-to-head goal difference", cmp: (a, b) => h2h.get(a.team.id)!.gd - h2h.get(b.team.id)!.gd },
    { label: "head-to-head goals", cmp: (a, b) => h2h.get(a.team.id)!.gf - h2h.get(b.team.id)!.gf },
  ];

  // Only apply H2H if every pairing in the cluster has actually been played;
  // otherwise H2H is not yet meaningful and we fall through to overall criteria.
  const fullyPlayed = clusterFullyPlayed(ids, fixtures);
  const criteria = fullyPlayed && depth < 4
    ? [...h2hCmp, ...byOverall]
    : byOverall;

  const sorted = [...cluster].sort((a, b) => {
    for (const c of criteria) {
      const d = c.cmp(a, b);
      if (d !== 0) return d > 0 ? -1 : 1;
    }
    return 0;
  });

  // Identify sub-clusters that remain tied across the H2H criteria only, and
  // re-resolve them (re-partition) so H2H is recomputed within the smaller set.
  if (fullyPlayed && depth < 4) {
    const out: TeamRow[] = [];
    let i = 0;
    while (i < sorted.length) {
      let j = i + 1;
      while (
        j < sorted.length &&
        h2hCmp.every((c) => c.cmp(sorted[i], sorted[j]) === 0)
      ) {
        j++;
      }
      const sub = sorted.slice(i, j);
      if (sub.length > 1 && sub.length < cluster.length) {
        out.push(...resolveCluster(sub, fixtures, depth + 1));
      } else {
        out.push(...sub);
      }
      i = j;
    }
    return out;
  }

  return sorted;
}

/**
 * Annotate each row with the criterion that separated it from the team directly
 * above. Run once over the fully-ordered group so singleton sub-clusters still
 * get labelled. Teams on different points are simply separated by "points".
 */
function annotateGroup(ordered: TeamRow[], fixtures: RawFixture[]): void {
  for (let i = 1; i < ordered.length; i++) {
    const above = ordered[i - 1];
    const row = ordered[i];
    if (above.points !== row.points) {
      row.decidedBy = "points";
      continue;
    }
    // Build the contiguous equal-points cluster this pair belongs to.
    let lo = i - 1;
    while (lo > 0 && ordered[lo - 1].points === row.points) lo--;
    let hi = i;
    while (hi + 1 < ordered.length && ordered[hi + 1].points === row.points) hi++;
    const cluster = ordered.slice(lo, hi + 1);
    const ids = new Set(cluster.map((r) => r.team.id));
    const h2h = headToHead(ids, fixtures);
    const h2hCmp: { label: string; cmp: Cmp }[] = [
      { label: "head-to-head points", cmp: (a, b) => h2h.get(a.team.id)!.points - h2h.get(b.team.id)!.points },
      { label: "head-to-head goal difference", cmp: (a, b) => h2h.get(a.team.id)!.gd - h2h.get(b.team.id)!.gd },
      { label: "head-to-head goals", cmp: (a, b) => h2h.get(a.team.id)!.gf - h2h.get(b.team.id)!.gf },
    ];
    const criteria = clusterFullyPlayed(ids, fixtures)
      ? [...h2hCmp, ...byOverall]
      : byOverall;
    for (const c of criteria) {
      if (c.cmp(above, row) !== 0) {
        row.decidedBy = c.label;
        break;
      }
    }
  }
}

/** True when every pair within the subset has a finished match between them. */
function clusterFullyPlayed(ids: Set<number>, fixtures: RawFixture[]): boolean {
  const idList = [...ids];
  const played = new Set<string>();
  for (const f of fixtures) {
    if (!isFinished(f)) continue;
    if (ids.has(f.home.id) && ids.has(f.away.id)) {
      played.add(pairKey(f.home.id, f.away.id));
    }
  }
  for (let i = 0; i < idList.length; i++) {
    for (let j = i + 1; j < idList.length; j++) {
      if (!played.has(pairKey(idList[i], idList[j]))) return false;
    }
  }
  return true;
}

function pairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * Sort the rows of a single group best-first applying the full tiebreaker
 * chain. Pure: does not mutate input ordering, returns a new array.
 */
export function rankGroup(rows: TeamRow[], fixtures: RawFixture[]): TeamRow[] {
  const byPoints = [...rows].sort((a, b) => b.points - a.points);
  const result: TeamRow[] = [];
  let i = 0;
  while (i < byPoints.length) {
    let j = i + 1;
    while (j < byPoints.length && byPoints[j].points === byPoints[i].points) j++;
    const cluster = byPoints.slice(i, j);
    result.push(...resolveCluster(cluster, fixtures));
    i = j;
  }
  annotateGroup(result, fixtures);
  return result;
}

/**
 * Cross-group ranking comparator for third-placed teams. Only overall criteria
 * apply (head-to-head is irrelevant between teams from different groups):
 * points → goal difference → goals scored → fair play → FIFA ranking.
 */
export function compareThirds(a: TeamRow, b: TeamRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gd !== a.gd) return b.gd - a.gd;
  if (b.gf !== a.gf) return b.gf - a.gf;
  if (a.disciplinary !== b.disciplinary) return a.disciplinary - b.disciplinary;
  return a.fifaRank - b.fifaRank;
}
