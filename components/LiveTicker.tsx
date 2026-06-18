"use client";

import { motion } from "framer-motion";
import type { RawFixture } from "@/lib/types";
import { kickoffLabel, statusLabel } from "@/lib/ui";
import { Flag } from "./CountryBadge";

function TickerItem({ fixture, live }: { fixture: RawFixture; live: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 ${
        live ? "bg-rose-500/10 ring-1 ring-rose-500/30" : "bg-white/5"
      }`}
    >
      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/50">
        {fixture.group}
      </span>
      <Flag code={fixture.home.code} className="h-3.5 w-5" />
      <span className="text-xs font-semibold">{fixture.home.code.toUpperCase().slice(0, 3)}</span>
      <span className="px-1 text-sm font-extrabold tabular-nums">
        {live || fixture.status === "FT"
          ? `${fixture.goals.home ?? 0}-${fixture.goals.away ?? 0}`
          : "vs"}
      </span>
      <span className="text-xs font-semibold">{fixture.away.code.toUpperCase().slice(0, 3)}</span>
      <Flag code={fixture.away.code} className="h-3.5 w-5" />
      <span
        className={`ml-1 flex items-center gap-1 text-[10px] font-bold ${
          live ? "text-rose-300" : "text-white/40"
        }`}
      >
        {live && <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-rose-400" />}
        {live ? statusLabel(fixture) : kickoffLabel(fixture.kickoff)}
      </span>
    </div>
  );
}

export function LiveTicker({
  live,
  upcoming,
}: {
  live: RawFixture[];
  upcoming: RawFixture[];
}) {
  const items = [...live, ...upcoming].slice(0, 16);
  if (items.length === 0) return null;
  const liveIds = new Set(live.map((f) => f.id));

  return (
    <div className="relative">
      <div className="scroll-x flex gap-2 overflow-x-auto pb-1">
        {items.map((f) => (
          <motion.div key={f.id} layout>
            <TickerItem fixture={f} live={liveIds.has(f.id)} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
