import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET(req: NextRequest) {
  const query: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    query[k] = v;
  });
  const result = await apiFetch("/api/partner/payout/banks", { method: "GET", query });
  return NextResponse.json(result.data, { status: result.status });
}
