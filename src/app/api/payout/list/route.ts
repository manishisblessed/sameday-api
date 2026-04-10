import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

/** Recent payouts for the specified/configured merchant (Postman "List Recent Transfers": `list=true&merchant_id=`). */
export async function GET(req: NextRequest) {
  // Accept merchant_id from query (dynamic selection) or fallback to env var
  const merchant_id =
    req.nextUrl.searchParams.get("merchant_id")?.trim() ||
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

  const result = await apiFetch("/api/partner/payout/status", {
    method: "GET",
    query: { list: "true", merchant_id },
  });
  return NextResponse.json(result.data, { status: result.status });
}
