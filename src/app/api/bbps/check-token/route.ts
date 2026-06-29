import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/bbps/check-token — verify that a browser-stored token is still valid.
 * Used on mount so the UI knows whether to show the password gate.
 * If BBPS_PASSWORD is not set, password gate is disabled (always valid).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.BBPS_PASSWORD?.trim();

  if (!secret) {
    return NextResponse.json({ valid: true, passwordDisabled: true });
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const { createHash } = await import("node:crypto");
  const today = new Date().toISOString().slice(0, 10);
  const expected = createHash("sha256").update(`${secret}:bbps:${today}`).digest("hex");

  const noPasswordToken = createHash("sha256").update(`no-bbps-password:${today}`).digest("hex");

  return NextResponse.json({ valid: body.token === expected || body.token === noPasswordToken });
}
