import type { FixtureStatus, QualificationState, RawFixture } from "./types";

export interface QualStyle {
  label: string;
  text: string;
  ring: string;
  dot: string;
  short: string;
}

/** Visual + textual treatment for each qualification state. */
export function qualStyle(q: QualificationState): QualStyle {
  switch (q) {
    case "advanced":
      return { label: "Through", short: "Q", text: "text-emerald-300", ring: "ring-emerald-400/60", dot: "bg-emerald-400" };
    case "advancing":
      return { label: "Advancing", short: "Q", text: "text-emerald-300", ring: "ring-emerald-400/40", dot: "bg-emerald-400" };
    case "thirdIn":
      return { label: "3rd — in", short: "3↑", text: "text-sky-300", ring: "ring-sky-400/40", dot: "bg-sky-400" };
    case "thirdOut":
      return { label: "3rd — out", short: "3", text: "text-amber-300", ring: "ring-amber-400/30", dot: "bg-amber-400" };
    case "eliminated":
      return { label: "Out", short: "✕", text: "text-rose-300/80", ring: "ring-rose-500/30", dot: "bg-rose-500/80" };
    default:
      return { label: "—", short: "", text: "text-slate-300", ring: "ring-white/10", dot: "bg-slate-500" };
  }
}

export function isLiveStatus(s: FixtureStatus): boolean {
  return s === "LIVE" || s === "HT";
}

export function isFinishedStatus(s: FixtureStatus): boolean {
  return s === "FT" || s === "AET" || s === "PEN";
}

/** Short status badge text for a fixture. */
export function statusLabel(f: RawFixture): string {
  if (f.status === "HT") return "HT";
  if (f.status === "LIVE") return f.elapsed ? `${f.elapsed}'` : "LIVE";
  if (isFinishedStatus(f.status)) return "FT";
  if (f.status === "PST") return "PST";
  if (f.status === "ABD") return "ABD";
  if (f.status === "CANC") return "CANC";
  return kickoffLabel(f.kickoff);
}

export function kickoffLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function kickoffDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function relativeTime(ms: number): string {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

/** A readable gradient from a team's two brand colours. */
export function teamGradient(primary: string, secondary: string): string {
  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
}
