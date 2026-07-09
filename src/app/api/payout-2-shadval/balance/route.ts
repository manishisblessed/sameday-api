import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await apiFetch("/api/partner/settlement/balance", {
    method: "GET",
  });
  return safeJsonResponse(result);
}
