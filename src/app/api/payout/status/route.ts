import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/lib/payout-service";
import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";

/**
 * GET /api/payout/status
 *
 * Query params (pick one):
 *   transactionId=<uuid>       — look up by Same Day Solution transaction UUID
 *   partnerTransId=<ref>       — look up by partner_trans_id
 *   list=true[&limit=N]        — list recent transactions (max 50)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const transactionId = searchParams.get("transactionId");
  const partnerTransId = searchParams.get("partnerTransId");
  const isList = searchParams.get("list") === "true";

  // ── List mode: proxy straight through ─────────────────────────────────────
  if (isList) {
    const query: Record<string, string> = { list: "true" };
    const limit = searchParams.get("limit");
    if (limit) query.limit = String(Math.min(Number(limit) || 20, 50));
    const result = await apiFetch("/api/partner/payout/status", {
      method: "GET",
      query,
    });
    return safeJsonResponse(result);
  }

  // ── Status check — also updates the DB row ─────────────────────────────────
  if (transactionId) {
    try {
      const data = await payoutService.checkStatus(
        transactionId,
        partnerTransId ?? undefined,
      );
      return NextResponse.json(data, {
        status: data.success ? 200 : 400,
      });
    } catch (err) {
      console.error("[payout/status] Error:", err);
      return NextResponse.json(
        { success: false, error: { message: "Status lookup failed" } },
        { status: 500 },
      );
    }
  }

  // ── partnerTransId only (no transactionId known) ───────────────────────────
  if (partnerTransId) {
    const result = await apiFetch("/api/partner/payout/status", {
      method: "GET",
      query: { partnerTransId },
    });
    return safeJsonResponse(result);
  }

  return NextResponse.json(
    {
      success: false,
      error: { message: "Provide transactionId, partnerTransId, or list=true" },
    },
    { status: 400 },
  );
}
