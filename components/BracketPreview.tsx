"use client";

import { motion } from "framer-motion";
import type { BracketSlot } from "@/lib/types";
import { Flag } from "./CountryBadge";

function Slot({ label, team }: { label: string; team: BracketSlot["home"] }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      {team ? (
        <>
          <Flag code={team.code} className="h-3.5 w-5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold">{team.name}</span>
        </>
      ) : (
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-white/35">{label}</span>
      )}
    </div>
  );
}

export function BracketPreview({
  bracket,
  approximate,
}: {
  bracket: BracketSlot[];
  approximate: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-white/80">
          Round of 32 — projected
        </h3>
        {approximate && (
          <span
            className="text-[10px] uppercase tracking-wide text-amber-300/70"
            title="Third-placed assignments follow FIFA's eligibility rules but may differ from the canonical Annex C scenario."
          >
            Provisional
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {bracket.map((slot, i) => (
          <motion.div
            key={slot.match}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.015, 0.3) }}
            className="overflow-hidden rounded-xl bg-black/20 ring-1 ring-white/5"
          >
            <Slot label={slot.homeLabel} team={slot.home} />
            <div className="h-px bg-white/5" />
            <Slot label={slot.awayLabel} team={slot.away} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
