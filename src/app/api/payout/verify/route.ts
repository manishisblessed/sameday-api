import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  try {
    const result = await apiFetch("/api/partner/payout/verify", {
      method: "POST",
      body,
    });

    if (!result.ok) {
      console.error(
        `[payout/verify] Upstream returned ${result.status}:`,
        JSON.stringify(result.data).slice(0, 300),
      );
    }

    return safeJsonResponse(result);
  } catch (err) {
    console.error("[payout/verify] Request failed:", err);
    return NextResponse.json(
      { success: false, error: { message: "Verification request failed. Please try again." } },
      { status: 502 },
    );
  }
}
