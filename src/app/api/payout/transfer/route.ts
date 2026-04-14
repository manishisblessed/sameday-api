import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeStatus } from "@/lib/api-status";

/** Initiate payout transfer (v3.0 — debits partner wallet, no merchant_id needed). */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  // v3.0: No merchant_id needed — remove if client sends it
  const payload = { ...body };
  delete payload.merchant_id;
  delete payload.retailer_id;

  const result = await apiFetch("/api/partner/payout/transfer", {
    method: "POST",
    body: payload,
  });
  return NextResponse.json(result.data, { status: safeStatus(result.status) });
}
