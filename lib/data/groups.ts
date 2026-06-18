import type { GroupId } from "../types";

export interface TeamSeed {
  name: string;
  code: string; // flag-icons code
  fifaRank: number;
  primary: string;
  secondary: string;
}

/**
 * 2026 FIFA World Cup groups (48 teams, A–L) from the official Final Draw held
 * 5 December 2025 in Washington, D.C. Used for the simulated fallback feed and
 * for branding/seeding metadata; when the live API is active, teams are matched
 * to this table by name to attach colours and FIFA ranking. FIFA ranks are
 * approximate and only ever act as the final tiebreaker.
 */
export const GROUPS: Record<GroupId, TeamSeed[]> = {
  A: [
    { name: "Mexico", code: "mx", fifaRank: 17, primary: "#006847", secondary: "#CE1126" },
    { name: "South Africa", code: "za", fifaRank: 56, primary: "#007749", secondary: "#FFB81C" },
    { name: "South Korea", code: "kr", fifaRank: 23, primary: "#C60C30", secondary: "#003478" },
    { name: "Czechia", code: "cz", fifaRank: 43, primary: "#11457E", secondary: "#D7141A" },
  ],
  B: [
    { name: "Canada", code: "ca", fifaRank: 30, primary: "#FF0000", secondary: "#FFFFFF" },
    { name: "Bosnia and Herzegovina", code: "ba", fifaRank: 74, primary: "#002F6C", secondary: "#FECB00" },
    { name: "Qatar", code: "qa", fifaRank: 53, primary: "#8A1538", secondary: "#FFFFFF" },
    { name: "Switzerland", code: "ch", fifaRank: 19, primary: "#D52B1E", secondary: "#FFFFFF" },
  ],
  C: [
    { name: "Brazil", code: "br", fifaRank: 5, primary: "#FFDF00", secondary: "#009739" },
    { name: "Morocco", code: "ma", fifaRank: 12, primary: "#C1272D", secondary: "#006233" },
    { name: "Haiti", code: "ht", fifaRank: 83, primary: "#00209F", secondary: "#D21034" },
    { name: "Scotland", code: "gb-sct", fifaRank: 35, primary: "#00205B", secondary: "#FFFFFF" },
  ],
  D: [
    { name: "United States", code: "us", fifaRank: 16, primary: "#0A3161", secondary: "#B31942" },
    { name: "Paraguay", code: "py", fifaRank: 38, primary: "#D52B1E", secondary: "#0038A8" },
    { name: "Australia", code: "au", fifaRank: 24, primary: "#00843D", secondary: "#FFCD00" },
    { name: "Türkiye", code: "tr", fifaRank: 26, primary: "#E30A17", secondary: "#FFFFFF" },
  ],
  E: [
    { name: "Germany", code: "de", fifaRank: 9, primary: "#000000", secondary: "#DD0000" },
    { name: "Curaçao", code: "cw", fifaRank: 90, primary: "#002B7F", secondary: "#F9E814" },
    { name: "Ivory Coast", code: "ci", fifaRank: 40, primary: "#F77F00", secondary: "#009E60" },
    { name: "Ecuador", code: "ec", fifaRank: 31, primary: "#FFDD00", secondary: "#034EA2" },
  ],
  F: [
    { name: "Netherlands", code: "nl", fifaRank: 7, primary: "#FF6200", secondary: "#21468B" },
    { name: "Japan", code: "jp", fifaRank: 18, primary: "#0B1560", secondary: "#E60012" },
    { name: "Sweden", code: "se", fifaRank: 28, primary: "#006AA7", secondary: "#FECC00" },
    { name: "Tunisia", code: "tn", fifaRank: 49, primary: "#E70013", secondary: "#FFFFFF" },
  ],
  G: [
    { name: "Belgium", code: "be", fifaRank: 8, primary: "#E30613", secondary: "#FDDA24" },
    { name: "Egypt", code: "eg", fifaRank: 33, primary: "#CE1126", secondary: "#000000" },
    { name: "Iran", code: "ir", fifaRank: 21, primary: "#239F40", secondary: "#DA0000" },
    { name: "New Zealand", code: "nz", fifaRank: 86, primary: "#FFFFFF", secondary: "#000000" },
  ],
  H: [
    { name: "Spain", code: "es", fifaRank: 2, primary: "#C60B1E", secondary: "#FFC400" },
    { name: "Cape Verde", code: "cv", fifaRank: 73, primary: "#003893", secondary: "#CF2027" },
    { name: "Saudi Arabia", code: "sa", fifaRank: 58, primary: "#006C35", secondary: "#FFFFFF" },
    { name: "Uruguay", code: "uy", fifaRank: 15, primary: "#5CBFEB", secondary: "#001489" },
  ],
  I: [
    { name: "France", code: "fr", fifaRank: 3, primary: "#002395", secondary: "#ED2939" },
    { name: "Senegal", code: "sn", fifaRank: 20, primary: "#00853F", secondary: "#FDEF42" },
    { name: "Iraq", code: "iq", fifaRank: 57, primary: "#007A3D", secondary: "#CE1126" },
    { name: "Norway", code: "no", fifaRank: 29, primary: "#BA0C2F", secondary: "#00205B" },
  ],
  J: [
    { name: "Argentina", code: "ar", fifaRank: 1, primary: "#75AADB", secondary: "#FFFFFF" },
    { name: "Algeria", code: "dz", fifaRank: 36, primary: "#006233", secondary: "#FFFFFF" },
    { name: "Austria", code: "at", fifaRank: 22, primary: "#ED2939", secondary: "#FFFFFF" },
    { name: "Jordan", code: "jo", fifaRank: 64, primary: "#007A3D", secondary: "#CE1126" },
  ],
  K: [
    { name: "Portugal", code: "pt", fifaRank: 6, primary: "#006600", secondary: "#FF0000" },
    { name: "DR Congo", code: "cd", fifaRank: 60, primary: "#007FFF", secondary: "#CE1021" },
    { name: "Uzbekistan", code: "uz", fifaRank: 52, primary: "#1EB53A", secondary: "#0099B5" },
    { name: "Colombia", code: "co", fifaRank: 13, primary: "#FCD116", secondary: "#003893" },
  ],
  L: [
    { name: "England", code: "gb-eng", fifaRank: 4, primary: "#FFFFFF", secondary: "#CF081F" },
    { name: "Croatia", code: "hr", fifaRank: 10, primary: "#FF0000", secondary: "#171796" },
    { name: "Ghana", code: "gh", fifaRank: 70, primary: "#006B3F", secondary: "#FCD116" },
    { name: "Panama", code: "pa", fifaRank: 41, primary: "#005293", secondary: "#D21034" },
  ],
};
