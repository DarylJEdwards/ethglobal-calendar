"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useWorldCupData } from "@/hooks/useWorldCupData";
import type { GroupId, WorldCupPayload } from "@/lib/types";
import { BracketPreview } from "./BracketPreview";
import { ConnectionStatus } from "./ConnectionStatus";
import { GroupCard } from "./GroupCard";
import { GroupFilter } from "./GroupFilter";
import { LiveTicker } from "./LiveTicker";
import { ThirdsRace } from "./ThirdsRace";

type View = "groups" | "progression";

export function Dashboard({ initial }: { initial: WorldCupPayload }) {
  const { data, updatedAt, connected } = useWorldCupData(initial);
  const [group, setGroup] = useState<GroupId | "all">("all");
  const [view, setView] = useState<View>("groups");

  const allFixtures = useMemo(
    () => [...data.liveFixtures, ...data.upcomingFixtures, ...data.recentFixtures],
    [data],
  );

  const liveGroups = useMemo(
    () => new Set(data.liveFixtures.map((f) => f.group)),
    [data.liveFixtures],
  );

  const visibleGroups =
    group === "all" ? data.groups : data.groups.filter((t) => t.group === group);

  const advanced = data.groups
    .flatMap((t) => t.rows)
    .filter((r) => r.qualification === "advanced" || r.qualification === "advancing").length;

  const tab = (v: View, label: string) =>
    `rounded-lg px-3 py-1.5 text-xs font-bold transition ${
      view === v ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-3 pb-16 sm:px-5">
      <header className="sticky top-0 z-20 -mx-3 mb-4 bg-pitch-950/70 px-3 py-3 backdrop-blur-md sm:-mx-5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="bg-gradient-to-r from-sky-300 via-white to-emerald-300 bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
              World Cup 2026 · Group Stage
            </h1>
            <p className="text-[11px] text-white/40">
              All 12 groups · live standings · tiebreakers · progression
            </p>
          </div>
          <ConnectionStatus meta={data.meta} updatedAt={updatedAt} connected={connected} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1">
            <button className={tab("groups", "")} onClick={() => setView("groups")}>
              Groups
            </button>
            <button className={tab("progression", "")} onClick={() => setView("progression")}>
              Progression
            </button>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/40">
            <span><b className="text-emerald-300">{advanced}</b> advancing</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline"><b className="text-white/70">{data.liveFixtures.length}</b> live now</span>
          </div>
        </div>
      </header>

      <div className="mb-4">
        <LiveTicker live={data.liveFixtures} upcoming={data.upcomingFixtures} />
      </div>

      {view === "groups" ? (
        <>
          <div className="mb-3">
            <GroupFilter selected={group} onSelect={setGroup} liveGroups={liveGroups} />
          </div>
          <motion.div
            layout
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {visibleGroups.map((table) => (
              <GroupCard key={table.group} table={table} fixtures={allFixtures} />
            ))}
          </motion.div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ThirdsRace thirds={data.thirds} />
          <BracketPreview bracket={data.bracket} approximate={data.bracketApproximate} />
        </div>
      )}

      <footer className="mt-10 text-center text-[10px] text-white/25">
        Data: {data.meta.source === "api" ? "API-Football (live)" : "simulated feed"} ·
        FIFA 2026 tiebreakers applied · updates automatically
      </footer>
    </div>
  );
}
