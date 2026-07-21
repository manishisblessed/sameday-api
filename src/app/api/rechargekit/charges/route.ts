import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";

export const dynamic = "force-dynamic";

/** POST /api/rechargekit/charges — partner-scheme charges + GST for a CC amount. */
export async function POST(req: NextRequest) {
  let body: { amount?: number } = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "amount must be a positive number" } },
      { status: 400 }
    );
  }

  const result = await apiFetch("/api/partner/rechargekit/charges", {
    method: "POST",
    body: { amount },
  });

  return safeJsonResponse(result);
}
