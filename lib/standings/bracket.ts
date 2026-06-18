import {
  type BracketSlot,
  type GroupId,
  type GroupTable,
  type TeamRef,
  type ThirdPlaceRank,
} from "../types";

type SlotSpec =
  | { kind: "winner"; group: GroupId }
  | { kind: "runnerUp"; group: GroupId }
  | { kind: "third"; groups: GroupId[] };

interface MatchSpec {
  match: string;
  home: SlotSpec;
  away: SlotSpec;
}

/**
 * Official 2026 Round-of-32 placeholder pairings (FIFA published bracket).
 * "3XXXX" slots take a third-placed team from one of the listed groups; which
 * one is determined per FIFA Annex C from the set of 8 qualifying thirds.
 */
const R32: MatchSpec[] = [
  m("R32-1",  w("E"), third("A", "B", "C", "D", "F")),
  m("R32-2",  w("I"), third("C", "D", "F", "G", "H")),
  m("R32-3",  r("A"), r("B")),
  m("R32-4",  w("F"), r("C")),
  m("R32-5",  r("K"), r("L")),
  m("R32-6",  w("H"), r("J")),
  m("R32-7",  w("D"), third("B", "E", "F", "I", "J")),
  m("R32-8",  w("G"), third("A", "E", "H", "I", "J")),
  m("R32-9",  w("C"), r("F")),
  m("R32-10", r("E"), r("I")),
  m("R32-11", w("A"), third("C", "E", "F", "H", "I")),
  m("R32-12", w("L"), third("E", "H", "I", "J", "K")),
  m("R32-13", w("J"), r("H")),
  m("R32-14", r("D"), r("G")),
  m("R32-15", w("B"), third("E", "F", "G", "I", "J")),
  m("R32-16", w("K"), third("D", "E", "I", "J", "L")),
];

function m(match: string, home: SlotSpec, away: SlotSpec): MatchSpec {
  return { match, home, away };
}
function w(group: GroupId): SlotSpec { return { kind: "winner", group }; }
function r(group: GroupId): SlotSpec { return { kind: "runnerUp", group }; }
function third(...groups: GroupId[]): SlotSpec { return { kind: "third", groups }; }

function label(spec: SlotSpec): string {
  if (spec.kind === "winner") return `1${spec.group}`;
  if (spec.kind === "runnerUp") return `2${spec.group}`;
  return `3rd ${spec.groups.join("/")}`;
}

/**
 * Assign the qualifying third-placed groups to the eight "third" slots so that
 * every slot receives a third from its eligible-groups list and no group is used
 * twice. Solved by ordered backtracking (8 slots — trivial search space).
 * Returns a map slotIndex -> groupId, or null if no valid assignment exists.
 */
function assignThirds(
  thirdSlots: { index: number; groups: GroupId[] }[],
  qualifying: GroupId[],
): Map<number, GroupId> | null {
  const available = new Set(qualifying);
  const result = new Map<number, GroupId>();

  // Order slots by fewest eligible options first to prune faster.
  const order = [...thirdSlots].sort(
    (a, b) =>
      a.groups.filter((g) => available.has(g)).length -
      b.groups.filter((g) => available.has(g)).length,
  );

  function solve(i: number): boolean {
    if (i === order.length) return true;
    const slot = order[i];
    for (const g of slot.groups) {
      if (!available.has(g)) continue;
      available.delete(g);
      result.set(slot.index, g);
      if (solve(i + 1)) return true;
      available.add(g);
      result.delete(slot.index);
    }
    return false;
  }

  return solve(0) ? result : null;
}

function teamFromTable(table: GroupTable | undefined, rank: number): TeamRef | null {
  if (!table) return null;
  const row = table.rows[rank - 1];
  if (!row || !table.complete) return null; // only lock once the group is final
  return row.team;
}

/**
 * Build the R32 bracket. Winner/runner-up slots resolve directly from completed
 * group tables; third slots resolve via the eligibility matching once the eight
 * qualifying thirds are known and their groups are complete.
 *
 * Returns the slots plus `approximate` — true when third assignment follows the
 * eligibility constraints but is not guaranteed to equal FIFA's canonical Annex C
 * scenario (the constraints can admit more than one valid matching).
 */
export function buildBracket(
  tables: GroupTable[],
  thirds: ThirdPlaceRank,
): { slots: BracketSlot[]; approximate: boolean } {
  const tableByGroup = new Map<GroupId, GroupTable>();
  for (const t of tables) tableByGroup.set(t.group, t);

  const thirdSlots = R32.flatMap((spec, index) =>
    spec.away.kind === "third"
      ? [{ index, groups: (spec.away as { groups: GroupId[] }).groups }]
      : [],
  );

  const allThirdsComplete =
    thirds.qualifyingGroups.length === 8 &&
    thirds.qualifyingGroups.every((g) => tableByGroup.get(g)?.complete);

  const assignment = allThirdsComplete
    ? assignThirds(thirdSlots, thirds.qualifyingGroups)
    : null;

  const slots: BracketSlot[] = R32.map((spec, index) => {
    const home = resolveSlot(spec.home, tableByGroup, assignment, index);
    const away = resolveSlot(spec.away, tableByGroup, assignment, index);
    return {
      match: spec.match,
      homeLabel: label(spec.home),
      awayLabel: label(spec.away),
      home,
      away,
    };
  });

  return { slots, approximate: assignment !== null };
}

function resolveSlot(
  spec: SlotSpec,
  tableByGroup: Map<GroupId, GroupTable>,
  assignment: Map<number, GroupId> | null,
  index: number,
): TeamRef | null {
  if (spec.kind === "winner") return teamFromTable(tableByGroup.get(spec.group), 1);
  if (spec.kind === "runnerUp") return teamFromTable(tableByGroup.get(spec.group), 2);
  if (!assignment) return null;
  const group = assignment.get(index);
  if (!group) return null;
  return teamFromTable(tableByGroup.get(group), 3);
}
