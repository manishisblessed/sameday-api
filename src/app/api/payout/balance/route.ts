import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";

/** Get partner wallet balance (v3.0 — dedicated partner wallet). */
export async function GET() {
  const result = await apiFetch("/api/partner/payout/balance", {
    method: "GET",
  });
  return safeJsonResponse(result);
}
