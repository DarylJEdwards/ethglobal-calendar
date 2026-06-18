"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RawFixture } from "@/lib/types";
import { isFinishedStatus, isLiveStatus, statusLabel } from "@/lib/ui";
import { Flag } from "./CountryBadge";

function Score({ fixture }: { fixture: RawFixture }) {
  const played = isLiveStatus(fixture.status) || isFinishedStatus(fixture.status);
  if (!played) {
    return <span className="text-xs font-medium text-white/40">vs</span>;
  }
  return (
    <span className="flex items-center gap-1 tabular-nums">
      <motion.span
        key={`h-${fixture.goals.home}`}
        initial={{ scale: 1.4 }}
        animate={{ scale: 1 }}
        className="text-sm font-bold"
      >
        {fixture.goals.home ?? 0}
      </motion.span>
      <span className="text-white/30">-</span>
      <motion.span
        key={`a-${fixture.goals.away}`}
        initial={{ scale: 1.4 }}
        animate={{ scale: 1 }}
        className="text-sm font-bold"
      >
        {fixture.goals.away ?? 0}
      </motion.span>
    </span>
  );
}

export function MatchCard({
  fixture,
  compact = false,
}: {
  fixture: RawFixture;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const live = isLiveStatus(fixture.status);
  const hasEvents = (fixture.events?.length ?? 0) > 0;

  return (
    <div
      className={`rounded-lg border border-white/5 bg-black/20 ${
        live ? "ring-1 ring-rose-500/30" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => hasEvents && setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 px-2 py-1.5 text-left ${
          hasEvents ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <Flag code={fixture.home.code} className="h-3 w-4 shrink-0" />
          <span className="truncate text-xs font-medium">{fixture.home.name}</span>
        </span>

        <span className="flex flex-col items-center px-1">
          <Score fixture={fixture} />
        </span>

        <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
          <span className="truncate text-right text-xs font-medium">{fixture.away.name}</span>
          <Flag code={fixture.away.code} className="h-3 w-4 shrink-0" />
        </span>

        <span
          className={`ml-1 w-12 shrink-0 text-right text-[10px] font-bold tabular-nums ${
            live ? "text-rose-300" : "text-white/40"
          }`}
        >
          {live && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-rose-400 align-middle" />}
          {statusLabel(fixture)}
        </span>
      </button>

      <AnimatePresence>
        {open && hasEvents && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="space-y-0.5 border-t border-white/5 px-3 py-2 text-[11px] text-white/60">
              {fixture.events!.map((ev, i) => {
                const side = ev.teamId === fixture.home.id ? "home" : "away";
                const icon = ev.type === "goal" ? "⚽" : ev.type === "red" ? "🟥" : "🟨";
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-2 ${side === "away" ? "flex-row-reverse text-right" : ""}`}
                  >
                    <span className="w-8 tabular-nums text-white/40">{ev.minute}&apos;</span>
                    <span>{icon}</span>
                    <span className="text-white/50">
                      {side === "home" ? fixture.home.name : fixture.away.name}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
