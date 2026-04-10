import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payout/unlock — verify the settlement access password.
 * Password is stored server-side in SETTLEMENT_PASSWORD env var.
 * Returns a short-lived token (SHA-256 of password + date) for the browser session.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SETTLEMENT_PASSWORD?.trim();
  if (!secret) {
    return NextResponse.json(
      { success: false, error: { message: "SETTLEMENT_PASSWORD not configured in .env.local." } },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const supplied = (body.password ?? "").trim();
  if (!supplied || supplied !== secret) {
    return NextResponse.json(
      { success: false, error: { message: "Incorrect password." } },
      { status: 401 }
    );
  }

  const { createHash } = await import("node:crypto");
  const today = new Date().toISOString().slice(0, 10);
  const token = createHash("sha256").update(`${secret}:${today}`).digest("hex");

  return NextResponse.json({ success: true, token });
}
