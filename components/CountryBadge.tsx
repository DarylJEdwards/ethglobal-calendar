import type { TeamRef } from "@/lib/types";

export function Flag({ code, className = "" }: { code: string; className?: string }) {
  // flag-icons renders a known ISO code; "xx" falls back to a neutral chip.
  if (!code || code === "xx") {
    return (
      <span
        className={`inline-block rounded-sm bg-white/15 ${className}`}
        aria-hidden
      />
    );
  }
  return <span className={`fi fi-${code} ${className}`} aria-hidden />;
}

export function CountryBadge({
  team,
  size = "md",
}: {
  team: TeamRef;
  size?: "sm" | "md" | "lg";
}) {
  const flagSize =
    size === "lg" ? "w-7 h-5" : size === "sm" ? "w-5 h-[15px]" : "w-6 h-[18px]";
  const textSize = size === "lg" ? "text-base" : size === "sm" ? "text-xs" : "text-sm";
  return (
    <span className="flex items-center gap-2 min-w-0">
      <Flag code={team.code} className={flagSize} />
      <span className={`truncate font-medium ${textSize}`}>{team.name}</span>
    </span>
  );
}
