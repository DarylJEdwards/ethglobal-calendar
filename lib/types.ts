// Shared domain types for the World Cup 2026 live group view.

export type GroupId =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

export const GROUP_IDS: GroupId[] = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
];

/** Raw fixture status, mirrors API-Football short status codes. */
export type FixtureStatus =
  | "NS"   // not started
  | "LIVE" // in play (1H/2H/ET)
  | "HT"   // half time
  | "FT"   // full time
  | "AET"  // after extra time
  | "PEN"  // decided by penalties
  | "PST"  // postponed
  | "ABD"  // abandoned
  | "CANC"; // cancelled

export interface TeamRef {
  id: number;
  name: string;
  /** flag-icons country code, e.g. "br", "us", "gb-eng". */
  code: string;
}

export type MatchEventType = "goal" | "yellow" | "red";

export interface MatchEvent {
  minute: number;
  teamId: number;
  type: MatchEventType;
  player?: string;
  detail?: string;
}

export interface RawFixture {
  id: number;
  group: GroupId;
  /** ISO kickoff timestamp (UTC). */
  kickoff: string;
  status: FixtureStatus;
  /** Minutes elapsed when LIVE/HT, else null. */
  elapsed: number | null;
  home: TeamRef;
  away: TeamRef;
  goals: { home: number | null; away: number | null };
  venue?: string;
  events?: MatchEvent[];
}

/** Static branding + seeding metadata for one team. */
export interface TeamMeta {
  id: number;
  name: string;
  code: string;
  group: GroupId;
  fifaRank: number;
  primary: string;
  secondary: string;
}

/** Where a team's adapter data came from. */
export type DataSource = "api" | "simulated";

export type StaleReason = "rate-limit" | "no-key" | "upstream-error" | "forced";

export interface AdapterResult {
  fixtures: RawFixture[];
  source: DataSource;
  fetchedAt: number;
  staleReason?: StaleReason;
}

/** Pluggable provider interface. */
export interface DataAdapter {
  readonly kind: DataSource;
  getFixtures(): Promise<AdapterResult>;
  getLiveFixtures(): Promise<AdapterResult>;
}

// ---- Computed standings types ----

export type GroupOutcome = "winner" | "runnerUp" | "third" | "fourth";

export type QualificationState =
  | "advanced"      // top-2, group complete
  | "advancing"     // top-2, provisional (group in progress)
  | "thirdIn"       // 3rd place currently inside the 8 best-thirds cut
  | "thirdOut"      // 3rd place currently outside the cut
  | "eliminated"    // out
  | "active";       // 4th place, group still in progress

export interface TeamRow {
  team: TeamRef;
  group: GroupId;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  yellow: number;
  red: number;
  /** Disciplinary penalty (lower is better for fair-play tiebreak). */
  disciplinary: number;
  fifaRank: number;
  primary: string;
  secondary: string;
  rankInGroup: number; // 1..4
  outcome: GroupOutcome;
  qualification: QualificationState;
  /** Which tiebreak criterion separated this team from the one above (for UI hints). */
  decidedBy?: string;
}

export interface GroupTable {
  group: GroupId;
  rows: TeamRow[];
  complete: boolean; // all 6 matches finished
  playedCount: number;
}

export interface ThirdPlaceRank {
  rows: TeamRow[];          // all 12 thirds, ranked
  qualifyingGroups: GroupId[]; // the (up to) 8 groups whose third advances
}

export interface BracketSlot {
  /** R32 match label, e.g. "R32-1". */
  match: string;
  homeLabel: string; // e.g. "1A" or "3rd (D/E/F)"
  awayLabel: string;
  home: TeamRef | null;
  away: TeamRef | null;
}

export type TournamentPhase = "pre" | "live" | "matchday-idle" | "off";

export interface WorldCupPayload {
  groups: GroupTable[];
  thirds: ThirdPlaceRank;
  bracket: BracketSlot[];
  bracketApproximate: boolean;
  liveFixtures: RawFixture[];
  upcomingFixtures: RawFixture[];
  recentFixtures: RawFixture[];
  meta: {
    source: DataSource;
    fetchedAt: number;
    staleReason?: StaleReason;
    phase: TournamentPhase;
    nextKickoff?: string;
    serverTime: number;
  };
}
