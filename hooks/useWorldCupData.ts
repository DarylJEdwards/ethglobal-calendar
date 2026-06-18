"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WorldCupPayload } from "@/lib/types";

interface State {
  data: WorldCupPayload;
  updatedAt: number;
  connected: boolean;
  refreshing: boolean;
}

/**
 * Polls /api/wc on an adaptive interval (fast during live windows, slow
 * otherwise) and pauses while the tab is hidden. Seeded with server-rendered
 * data so the first paint is instant.
 */
export function useWorldCupData(initial: WorldCupPayload): State {
  const [data, setData] = useState(initial);
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [connected, setConnected] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const phaseRef = useRef(initial.meta.phase);
  phaseRef.current = data.meta.phase;

  const fetchOnce = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/wc", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as WorldCupPayload;
      setData(json);
      setUpdatedAt(Date.now());
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const loop = () => {
      const interval = phaseRef.current === "live" ? 20_000 : 60_000;
      timer = setTimeout(async () => {
        if (typeof document !== "undefined" && !document.hidden) {
          await fetchOnce();
        }
        if (!stopped) loop();
      }, interval);
    };
    loop();

    const onVisible = () => {
      if (typeof document !== "undefined" && !document.hidden) fetchOnce();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchOnce]);

  return { data, updatedAt, connected, refreshing };
}
