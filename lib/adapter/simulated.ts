import { SCHEDULE, TEAMS } from "../data";
import { simulateSchedule } from "../live/liveEngine";
import type { AdapterResult, DataAdapter } from "../types";

/**
 * Self-contained adapter: bundled 48-team / 72-fixture schedule driven by the
 * deterministic live engine, so the app renders a complete, animating table
 * even with no API key or when the upstream is rate-limited.
 */
export class SimulatedAdapter implements DataAdapter {
  readonly kind = "simulated" as const;

  constructor(private staleReason?: AdapterResult["staleReason"]) {}

  private snapshot(): AdapterResult {
    const now = Date.now();
    return {
      fixtures: simulateSchedule(SCHEDULE, TEAMS, now),
      source: "simulated",
      fetchedAt: now,
      staleReason: this.staleReason,
    };
  }

  getFixtures(): Promise<AdapterResult> {
    return Promise.resolve(this.snapshot());
  }

  getLiveFixtures(): Promise<AdapterResult> {
    return Promise.resolve(this.snapshot());
  }
}
