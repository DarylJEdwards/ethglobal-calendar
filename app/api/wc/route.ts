import { NextResponse } from "next/server";
import { cacheSeconds, getPayload } from "@/lib/cache/cacheManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const payload = await getPayload();
  const s = cacheSeconds(payload.meta.phase);
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": `public, s-maxage=${s}, stale-while-revalidate=${s * 6}`,
    },
  });
}
