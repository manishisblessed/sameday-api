import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { message: "Invalid JSON body" } }, { status: 400 });
  }

  // Accept merchant_id from request body (dynamic selection from List My Merchants)
  // Fallback to PAYOUT_PARTNER_ID env var for backward compatibility
  const merchant_id =
    (typeof body.merchant_id === "string" && body.merchant_id.trim()) ||
    (typeof body.retailer_id === "string" && body.retailer_id.trim()) ||
    process.env.PAYOUT_PARTNER_ID?.trim();

  if (!merchant_id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CONFIG",
          message:
            "No merchant selected. Run 'List My Merchants' to see linked merchants, or set PAYOUT_PARTNER_ID in .env.local.",
        },
      },
      { status: 400 }
    );
  }

  const rest = { ...body } as Record<string, unknown>;
  delete rest.merchant_id;
  delete rest.retailer_id;

  const result = await apiFetch("/api/partner/payout/transfer", {
    method: "POST",
    body: { ...rest, merchant_id },
  });
  return NextResponse.json(result.data, { status: result.status });
}
