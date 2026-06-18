"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { GroupTable, RawFixture, TeamRow } from "@/lib/types";
import { qualStyle, teamGradient } from "@/lib/ui";
import { Flag } from "./CountryBadge";
import { MatchCard } from "./MatchCard";

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="w-7 text-center tabular-nums">
      <span className="block text-sm font-semibold">{value}</span>
      <span className="hidden text-[9px] uppercase tracking-wide text-white/30 sm:block">
        {label}
      </span>
    </div>
  );
}

function Row({ row, rank }: { row: TeamRow; rank: number }) {
  const q = qualStyle(row.qualification);
  return (
    <motion.div
      layout
      layoutId={`team-${row.team.id}`}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      className={`relative flex items-center gap-2 rounded-lg px-2 py-1.5 ring-1 ${q.ring}`}
      style={{
        background: `linear-gradient(90deg, ${row.primary}22, transparent 60%)`,
      }}
      title={row.decidedBy ? `Separated by ${row.decidedBy}` : undefined}
    >
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11px] font-bold text-black/80"
        style={{ background: teamGradient(row.primary, row.secondary) }}
      >
        {rank}
      </span>
      <Flag code={row.team.code} className="h-[15px] w-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{row.team.name}</span>

      <div className="flex items-center gap-0.5 text-white/70">
        <Stat value={row.played} label="P" />
        <Stat value={row.gd > 0 ? `+${row.gd}` : row.gd} label="GD" />
      </div>
      <div className="w-9 text-right">
        <span className="text-base font-extrabold tabular-nums text-white">{row.points}</span>
      </div>
      <span className={`h-2 w-2 shrink-0 rounded-full ${q.dot}`} title={q.label} />
    </motion.div>
  );
}

export function GroupCard({
  table,
  fixtures,
}: {
  table: GroupTable;
  fixtures: RawFixture[];
}) {
  const groupFixtures = fixtures
    .filter((f) => f.group === table.group)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const liveCount = groupFixtures.filter(
    (f) => f.status === "LIVE" || f.status === "HT",
  ).length;

  return (
    <motion.section
      layout
      className="glass flex flex-col overflow-hidden rounded-2xl p-3"
    >
      <header className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-sm font-black">
            {table.group}
          </span>
          <h3 className="text-sm font-semibold tracking-wide text-white/80">
            Group {table.group}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {liveCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-rose-400" />
              LIVE
            </span>
          )}
          <span className="text-[10px] font-medium uppercase tracking-wide text-white/30">
            {table.complete ? "Final" : `${table.playedCount}/6`}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {table.rows.map((row, i) => (
            <Row key={row.team.id} row={row} rank={i + 1} />
          ))}
        </AnimatePresence>
      </div>

      {groupFixtures.length > 0 && (
        <details className="group mt-2">
          <summary className="cursor-pointer list-none px-1 text-[11px] font-medium text-white/40 transition hover:text-white/70">
            <span className="group-open:hidden">Show matches ▾</span>
            <span className="hidden group-open:inline">Hide matches ▴</span>
          </summary>
          <div className="mt-2 flex flex-col gap-1.5">
            {groupFixtures.map((f) => (
              <MatchCard key={f.id} fixture={f} compact />
            ))}
          </div>
        </details>
      )}
    </motion.section>
  );
}
