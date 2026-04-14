import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeStatus } from "@/lib/api-status";

export async function GET(req: NextRequest) {
  const query: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    query[k] = v;
  });
  const result = await apiFetch("/api/partner/payout/status", { method: "GET", query });
  return NextResponse.json(result.data, { status: safeStatus(result.status) });
}
