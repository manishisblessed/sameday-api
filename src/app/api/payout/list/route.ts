import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/lib/payout-service";

/**
 * GET /api/payout/list[?limit=N]
 *
 * Returns the most recent payout transactions from the upstream API.
 * Default limit: 20 — max: 50.
 */
export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 50);

  try {
    const data = await payoutService.listTransactions(limit);
    return NextResponse.json(data, { status: data.success ? 200 : 400 });
  } catch (err) {
    console.error("[payout/list] Error:", err);
    return NextResponse.json(
      { success: false, error: { message: "Could not fetch transactions" } },
      { status: 500 },
    );
  }
}
