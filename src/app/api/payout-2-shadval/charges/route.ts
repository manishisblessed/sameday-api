import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const amount = searchParams.get("amount");
  const mode = searchParams.get("mode") || "IMPS";

  if (!amount) {
    return NextResponse.json(
      { success: false, error: { message: "Amount is required" } },
      { status: 400 }
    );
  }

  const result = await apiFetch("/api/partner/settlement/charges", {
    method: "GET",
    query: { amount, mode },
  });
  return safeJsonResponse(result);
}
