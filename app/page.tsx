import { Dashboard } from "@/components/Dashboard";
import { getPayload } from "@/lib/cache/cacheManager";

// Always render fresh on the server; the client then polls /api/wc.
export const dynamic = "force-dynamic";

export default async function Page() {
  const initial = await getPayload();
  return <Dashboard initial={initial} />;
}
