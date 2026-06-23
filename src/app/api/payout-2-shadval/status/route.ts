import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const referenceId = searchParams.get("reference_id");
  const list = searchParams.get("list");
  const limit = searchParams.get("limit");

  const query: Record<string, string> = {};

  if (list === "true") {
    query.list = "true";
    if (limit) query.limit = limit;
  } else if (referenceId) {
    query.reference_id = referenceId;
  } else {
    return NextResponse.json(
      { success: false, error: { message: "reference_id or list=true is required" } },
      { status: 400 }
    );
  }

  const result = await apiFetch("/api/partner/settlement/status", {
    method: "GET",
    query,
  });
  return safeJsonResponse(result);
}
