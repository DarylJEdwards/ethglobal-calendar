import { TEAMS } from "../data";
import type {
  AdapterResult,
  DataAdapter,
  FixtureStatus,
  GroupId,
  RawFixture,
  TeamMeta,
  TeamRef,
} from "../types";

const BASE = "https://v3.football.api-sports.io";

export class RateLimitError extends Error {}
export class UpstreamError extends Error {}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

const TEAM_BY_NAME = new Map<string, TeamMeta>();
for (const t of TEAMS) TEAM_BY_NAME.set(normalize(t.name), t);

function mapStatus(short: string): FixtureStatus {
  switch (short) {
    case "1H": case "2H": case "ET": case "BT": case "P": case "LIVE": case "INT":
      return "LIVE";
    case "HT": return "HT";
    case "FT": return "FT";
    case "AET": return "AET";
    case "PEN": return "PEN";
    case "PST": return "PST";
    case "ABD": return "ABD";
    case "CANC": case "AWD": case "WO": return "CANC";
    default: return "NS";
  }
}

function parseGroup(round: string | undefined): GroupId | null {
  if (!round) return null;
  const m = /group\s+([a-l])/i.exec(round);
  return m ? (m[1].toUpperCase() as GroupId) : null;
}

interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null }; venue?: { name?: string; city?: string } };
  league: { round?: string };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number | null; away: number | null };
}

function enrichTeam(apiTeam: { id: number; name: string }): { ref: TeamRef; group: GroupId | null } {
  const meta = TEAM_BY_NAME.get(normalize(apiTeam.name));
  if (meta) return { ref: { id: meta.id, name: meta.name, code: meta.code }, group: meta.group };
  return { ref: { id: apiTeam.id, name: apiTeam.name, code: "xx" }, group: null };
}

function toRawFixture(api: ApiFixture): RawFixture | null {
  const home = enrichTeam(api.teams.home);
  const away = enrichTeam(api.teams.away);
  const group = parseGroup(api.league.round) ?? home.group ?? away.group;
  if (!group) return null; // not a group-stage fixture we track
  return {
    id: api.fixture.id,
    group,
    kickoff: api.fixture.date,
    status: mapStatus(api.fixture.status.short),
    elapsed: api.fixture.status.elapsed,
    home: home.ref,
    away: away.ref,
    goals: { home: api.goals.home, away: api.goals.away },
    venue: api.fixture.venue?.name
      ? `${api.fixture.venue.name}${api.fixture.venue.city ? ", " + api.fixture.venue.city : ""}`
      : undefined,
  };
}

async function call(path: string, key: string): Promise<ApiFixture[]> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "x-apisports-key": key },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (res.status === 429) throw new RateLimitError("API-Football rate limit hit");
    if (!res.ok) throw new UpstreamError(`API-Football ${res.status}`);
    const json = await res.json();
    // The API reports quota errors in a 200 body with an `errors` object.
    if (json?.errors && Object.keys(json.errors).length > 0) {
      const msg = JSON.stringify(json.errors);
      if (/limit|plan|requests/i.test(msg)) throw new RateLimitError(msg);
      throw new UpstreamError(msg);
    }
    return (json?.response ?? []) as ApiFixture[];
  } finally {
    clearTimeout(timeout);
  }
}

export class ApiFootballAdapter implements DataAdapter {
  readonly kind = "api" as const;

  constructor(
    private key: string,
    private leagueId: string,
    private season: string,
  ) {}

  private async query(path: string): Promise<AdapterResult> {
    const raw = await call(path, this.key);
    const fixtures = raw
      .map(toRawFixture)
      .filter((f): f is RawFixture => f !== null);
    return { fixtures, source: "api", fetchedAt: Date.now() };
  }

  getFixtures(): Promise<AdapterResult> {
    return this.query(`/fixtures?league=${this.leagueId}&season=${this.season}`);
  }

  getLiveFixtures(): Promise<AdapterResult> {
    return this.query(`/fixtures?league=${this.leagueId}&season=${this.season}&live=all`);
  }
}
