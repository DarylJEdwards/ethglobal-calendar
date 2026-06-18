"use client";

import { useEffect, useState } from "react";
import type { WorldCupPayload } from "@/lib/types";
import { relativeTime } from "@/lib/ui";

function statusFor(meta: WorldCupPayload["meta"], connected: boolean) {
  if (!connected) return { label: "Reconnecting", dot: "bg-amber-400", text: "text-amber-300" };
  if (meta.staleReason === "rate-limit")
    return { label: "Rate-limited · last data", dot: "bg-rose-400", text: "text-rose-300" };
  if (meta.staleReason === "upstream-error")
    return { label: "Upstream issue · cached", dot: "bg-amber-400", text: "text-amber-300" };
  if (meta.source === "simulated")
    return { label: "Simulated live", dot: "bg-sky-400", text: "text-sky-300" };
  if (meta.phase === "live")
    return { label: "Live", dot: "bg-emerald-400", text: "text-emerald-300" };
  return { label: "Live data", dot: "bg-emerald-400", text: "text-emerald-300" };
}

export function ConnectionStatus({
  meta,
  updatedAt,
  connected,
}: {
  meta: WorldCupPayload["meta"];
  updatedAt: number;
  connected: boolean;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const s = statusFor(meta, connected);
  return (
    <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5">
      <span className={`h-2 w-2 rounded-full ${s.dot} ${meta.phase === "live" ? "animate-pulse-dot" : ""}`} />
      <span className={`text-xs font-semibold ${s.text}`}>{s.label}</span>
      <span className="hidden text-[10px] text-white/30 sm:inline">·</span>
      <span className="hidden text-[10px] text-white/40 sm:inline">{relativeTime(updatedAt)}</span>
    </div>
  );
}
