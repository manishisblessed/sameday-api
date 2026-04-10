import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { message: "Invalid JSON body" } }, { status: 400 });
  }
  const result = await apiFetch("/api/partner/payout/verify", { method: "POST", body });
  return NextResponse.json(result.data, { status: result.status });
}
