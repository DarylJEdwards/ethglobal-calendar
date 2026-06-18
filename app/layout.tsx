import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup 2026 · Live Group Stage",
  description:
    "Fully live, auto-updating view of all 12 World Cup 2026 groups — standings, FIFA tiebreakers, the best-third-placed race and Round-of-32 progression.",
};

export const viewport: Viewport = {
  themeColor: "#03070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="stadium-bg min-h-screen">{children}</body>
    </html>
  );
}
