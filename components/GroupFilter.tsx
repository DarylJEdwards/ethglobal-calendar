"use client";

import { GROUP_IDS, type GroupId } from "@/lib/types";

export function GroupFilter({
  selected,
  onSelect,
  liveGroups,
}: {
  selected: GroupId | "all";
  onSelect: (g: GroupId | "all") => void;
  liveGroups: Set<GroupId>;
}) {
  const chip = (active: boolean) =>
    `relative rounded-lg px-2.5 py-1 text-xs font-bold transition ${
      active ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <button className={chip(selected === "all")} onClick={() => onSelect("all")}>
        All
      </button>
      {GROUP_IDS.map((g) => (
        <button key={g} className={chip(selected === g)} onClick={() => onSelect(g)}>
          {g}
          {liveGroups.has(g) && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse-dot rounded-full bg-rose-400 ring-2 ring-pitch-950" />
          )}
        </button>
      ))}
    </div>
  );
}
