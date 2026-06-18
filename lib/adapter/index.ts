import type { DataAdapter } from "../types";
import { ApiFootballAdapter } from "./apiFootball";
import { SimulatedAdapter } from "./simulated";

export interface RuntimeConfig {
  key: string | null;
  leagueId: string;
  season: string;
  dailyBudget: number;
  forceSimulated: boolean;
}

export function getConfig(): RuntimeConfig {
  const key = process.env.API_FOOTBALL_KEY?.trim() || null;
  return {
    key,
    leagueId: process.env.WC_LEAGUE_ID?.trim() || "1",
    season: process.env.WC_SEASON?.trim() || "2026",
    dailyBudget: Number(process.env.WC_DAILY_BUDGET) || 90,
    forceSimulated: process.env.WC_FORCE_SIMULATED === "true",
  };
}

/** Returns the live adapter when a key is present, else the simulated one. */
export function selectAdapter(cfg: RuntimeConfig): DataAdapter {
  if (cfg.forceSimulated || !cfg.key) return new SimulatedAdapter();
  return new ApiFootballAdapter(cfg.key, cfg.leagueId, cfg.season);
}
