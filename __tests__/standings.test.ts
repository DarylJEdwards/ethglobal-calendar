import { describe, expect, it } from "vitest";
import { buildPayload } from "../lib/payload";
import { rankGroup } from "../lib/standings/tiebreakers";
import { buildGroupRows, computeGroupTables, rankThirds } from "../lib/standings/compute";
import type { GroupId, MatchEvent, RawFixture, TeamMeta } from "../lib/types";

// --- helpers ----------------------------------------------------------------

let fid = 1;
function fixture(
  group: GroupId,
  home: TeamMeta,
  away: TeamMeta,
  hg: number,
  ag: number,
  events: MatchEvent[] = [],
): RawFixture {
  return {
    id: fid++,
    group,
    kickoff: "2026-06-12T18:00:00Z",
    status: "FT",
    elapsed: null,
    home: { id: home.id, name: home.name, code: home.code },
    away: { id: away.id, name: away.name, code: away.code },
    goals: { home: hg, away: ag },
    events,
  };
}

function team(id: number, name: string, fifaRank: number): TeamMeta {
  return { id, name, code: "xx", group: "A", fifaRank, primary: "#000", secondary: "#fff" };
}

function names(rows: { team: { name: string } }[]): string[] {
  return rows.map((r) => r.team.name);
}

// 4 teams used across group tests.
const A = team(1, "Alpha", 10);
const B = team(2, "Bravo", 20);
const C = team(3, "Charlie", 30);
const D = team(4, "Delta", 40);
const teams = [A, B, C, D];

// --- tests ------------------------------------------------------------------

describe("group ranking by points", () => {
  it("orders strictly by points when no ties", () => {
    const fixtures = [
      fixture("A", A, B, 1, 0), // A win
      fixture("A", A, C, 2, 0), // A win
      fixture("A", A, D, 3, 0), // A win
      fixture("A", B, C, 1, 0), // B win
      fixture("A", B, D, 1, 0), // B win
      fixture("A", C, D, 1, 0), // C win
    ];
    const rows = buildGroupRows("A", teams, fixtures, false);
    expect(names(rankGroup(rows, fixtures))).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]);
  });
});

describe("head-to-head tiebreak (2-way)", () => {
  it("uses the result between the level teams before overall GD", () => {
    // Alpha and Bravo both finish level on 6 points; Bravo has a much better
    // overall goal difference, but Alpha beat Bravo head-to-head, so Alpha must
    // still rank above Bravo. (Charlie & Delta form a separate cluster on 3.)
    const fixtures = [
      fixture("A", A, B, 1, 0), // Alpha beats Bravo -> h2h decisive
      fixture("A", B, C, 1, 0), // Bravo beats Charlie
      fixture("A", A, C, 0, 1), // Alpha loses to Charlie
      fixture("A", A, D, 1, 0), // Alpha beats Delta
      fixture("A", B, D, 5, 0), // Bravo thrashes Delta -> superior overall GD
      fixture("A", C, D, 0, 1), // Delta beats Charlie
    ];
    const rows = buildGroupRows("A", teams, fixtures, false);
    const ranked = rankGroup(rows, fixtures);
    const ai = ranked.findIndex((r) => r.team.name === "Alpha");
    const bi = ranked.findIndex((r) => r.team.name === "Bravo");
    expect(ai).toBeLessThan(bi);
    expect(ranked[bi].decidedBy).toBe("head-to-head points");
  });
});

describe("fair-play tiebreak", () => {
  it("ranks the team with fewer disciplinary points higher when all else equal", () => {
    // Alpha and Bravo identical record and drew head-to-head; Bravo picked up a
    // red card, so Alpha wins the fair-play criterion.
    const fixtures = [
      fixture("A", A, B, 0, 0), // draw h2h, equal h2h everything
      fixture("A", A, C, 1, 0),
      fixture("A", A, D, 1, 0),
      fixture("A", B, C, 1, 0),
      fixture("A", B, D, 1, 0, [{ minute: 70, teamId: B.id, type: "red" }]),
      fixture("A", C, D, 0, 0),
    ];
    const rows = buildGroupRows("A", teams, fixtures, false);
    const ranked = rankGroup(rows, fixtures);
    const ai = ranked.findIndex((r) => r.team.name === "Alpha");
    const bi = ranked.findIndex((r) => r.team.name === "Bravo");
    expect(ai).toBeLessThan(bi);
    expect(ranked[bi].decidedBy).toBe("fair play");
  });
});

describe("FIFA ranking as last resort", () => {
  it("breaks an otherwise total tie by FIFA rank (lower is better)", () => {
    // Alpha (rank 10) and Bravo (rank 20) are identical in every respect.
    const fixtures = [
      fixture("A", A, B, 0, 0),
      fixture("A", A, C, 1, 0),
      fixture("A", A, D, 1, 0),
      fixture("A", B, C, 1, 0),
      fixture("A", B, D, 1, 0),
      fixture("A", C, D, 0, 0),
    ];
    const rows = buildGroupRows("A", teams, fixtures, false);
    const ranked = rankGroup(rows, fixtures);
    expect(ranked.findIndex((r) => r.team.name === "Alpha"))
      .toBeLessThan(ranked.findIndex((r) => r.team.name === "Bravo"));
    const bi = ranked.findIndex((r) => r.team.name === "Bravo");
    expect(ranked[bi].decidedBy).toBe("FIFA ranking");
  });
});

describe("thirds ranking", () => {
  it("ranks the 12 third-placed teams and qualifies the best 8", () => {
    // Build 12 groups where each group's third place has a distinct points total
    // so ordering is deterministic and the bottom 4 are excluded.
    const groupIds: GroupId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    const allTeams: TeamMeta[] = [];
    const fixtures: RawFixture[] = [];
    let tid = 100;
    groupIds.forEach((g, gi) => {
      const t = [0, 1, 2, 3].map((k) =>
        ({ id: tid++, name: `${g}${k}`, code: "xx", group: g, fifaRank: 50 + gi, primary: "#000", secondary: "#fff" }) as TeamMeta,
      );
      allTeams.push(...t);
      // t[0] wins all, t[1] second, t[2] third with goals scaled by group index,
      // t[3] last. Give the third-place team gi goals so thirds differ.
      fixtures.push(fixture(g, t[0], t[3], 3, 0));
      fixtures.push(fixture(g, t[0], t[2], 1, 0));
      fixtures.push(fixture(g, t[1], t[0], 0, 0)); // keep t0 top
      fixtures.push(fixture(g, t[1], t[3], 2, 0));
      fixtures.push(fixture(g, t[2], t[1], 0, 0));
      fixtures.push(fixture(g, t[2], t[3], gi, 0)); // third place's goals vary by group
    });
    const tables = computeGroupTables(
      Object.fromEntries(groupIds.map((g) => [g, allTeams.filter((t) => t.group === g)])) as Record<GroupId, TeamMeta[]>,
      fixtures,
    );
    const thirds = rankThirds(tables);
    expect(thirds.rows).toHaveLength(12);
    expect(thirds.qualifyingGroups).toHaveLength(8);
    // Groups with the most third-place goals (highest gi) should qualify.
    expect(thirds.qualifyingGroups).toContain("L");
    expect(thirds.qualifyingGroups).not.toContain("A");
  });
});

describe("payload assembly", () => {
  it("produces 12 group tables and a 16-match bracket", () => {
    const groupIds: GroupId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    const allTeams: TeamMeta[] = [];
    let tid = 500;
    groupIds.forEach((g) => {
      for (let k = 0; k < 4; k++) {
        allTeams.push({ id: tid++, name: `${g}${k}`, code: "xx", group: g, fifaRank: tid, primary: "#000", secondary: "#fff" });
      }
    });
    const payload = buildPayload(allTeams, [], { source: "simulated", fetchedAt: Date.now() });
    expect(payload.groups).toHaveLength(12);
    expect(payload.bracket).toHaveLength(16);
    expect(payload.meta.source).toBe("simulated");
  });
});
