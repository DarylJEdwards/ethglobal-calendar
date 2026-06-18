"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ThirdPlaceRank } from "@/lib/types";
import { Flag } from "./CountryBadge";

/** The cross-group race for the eight best third-placed teams. */
export function ThirdsRace({ thirds }: { thirds: ThirdPlaceRank }) {
  if (thirds.rows.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-white/80">
          Best third-placed teams
        </h3>
        <span className="text-[10px] uppercase tracking-wide text-white/40">
          Top 8 advance
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {thirds.rows.map((row, i) => {
            const inCut = i < 8;
            return (
              <motion.div key={row.team.id}>
                {i === 8 && (
                  <div className="my-1.5 flex items-center gap-2">
                    <div className="h-px flex-1 bg-rose-400/40" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-rose-300/70">
                      Cut line
                    </span>
                    <div className="h-px flex-1 bg-rose-400/40" />
                  </div>
                )}
                <motion.div
                  layout
                  layoutId={`third-${row.team.id}`}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ring-1 ${
                    inCut ? "bg-sky-400/10 ring-sky-400/30" : "bg-white/[0.03] ring-white/5 opacity-70"
                  }`}
                >
                  <span className="w-5 text-center text-xs font-bold text-white/40">{i + 1}</span>
                  <span className="grid h-5 w-5 place-items-center rounded bg-white/10 text-[10px] font-bold">
                    {row.group}
                  </span>
                  <Flag code={row.team.code} className="h-[15px] w-5" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.team.name}</span>
                  <span className="text-xs tabular-nums text-white/50">
                    {row.gd > 0 ? `+${row.gd}` : row.gd} GD
                  </span>
                  <span className="w-8 text-right text-sm font-bold tabular-nums">{row.points}</span>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
