import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

/** Recent payouts for the partner (v3.0 — no merchant_id needed). */
export async function GET() {
  const result = await apiFetch("/api/partner/payout/status", {
    method: "GET",
    query: { list: "true" },
  });
  return NextResponse.json(result.data, { status: result.status });
}
