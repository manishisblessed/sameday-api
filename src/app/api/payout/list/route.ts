import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";

/** Recent payouts for the partner (v3.0 — no merchant_id needed). */
export async function GET() {
  const result = await apiFetch("/api/partner/payout/status", {
    method: "GET",
    query: { list: "true" },
  });
  return safeJsonResponse(result);
}
