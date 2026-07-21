import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";
import type { RechargeKitStatusRequest, RechargeKitStatusResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/rechargekit/status — query a CC payment by txn_id OR request_id.
 * Also used as the safe recovery path after a Pay timeout/network error.
 */
export async function POST(req: NextRequest) {
  let body: RechargeKitStatusRequest = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const txn_id = String(body.txn_id ?? "").trim();
  const request_id = String(body.request_id ?? "").trim();

  if (!txn_id && !request_id) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "txn_id or request_id is required" } },
      { status: 400 }
    );
  }

  const payload: RechargeKitStatusRequest = {};
  if (txn_id) payload.txn_id = txn_id;
  if (request_id) payload.request_id = request_id;

  const result = await apiFetch<RechargeKitStatusResponse>("/api/partner/rechargekit/status", {
    method: "POST",
    body: payload,
  });

  const d = (typeof result.data === "object" && result.data) || {};
  console.log(
    "[rechargekit/status]",
    JSON.stringify({
      http: result.status,
      status: (d as RechargeKitStatusResponse).status,
      txn_id: (d as RechargeKitStatusResponse).txn_id ?? txn_id,
      request_id: (d as RechargeKitStatusResponse).request_id ?? request_id,
    })
  );

  return safeJsonResponse(result);
}
