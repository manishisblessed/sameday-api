import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

/** Get partner wallet balance (v3.0 — dedicated partner wallet). */
export async function GET() {
  const result = await apiFetch("/api/partner/payout/balance", {
    method: "GET",
  });
  return NextResponse.json(result.data, { status: result.status });
}
