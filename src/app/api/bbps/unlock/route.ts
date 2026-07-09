import { NextRequest, NextResponse } from "next/server";
import { verifyGatePassword, gateCookieName, gateCookieOptions } from "@/lib/access-gate";

/**
 * POST /api/bbps/unlock — verify the BBPS access password.
 * Password is stored server-side in BBPS_PASSWORD env var.
 * If BBPS_PASSWORD is not set, password gate is disabled (auto-unlock).
 * On success, sets an httpOnly cookie the proxy uses to authorize BBPS API calls.
 */
export async function POST(req: NextRequest) {
  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Empty/invalid body is fine for the "is the gate disabled?" probe.
  }

  const result = verifyGatePassword("bbps", body.password);

  if (result === null) {
    return NextResponse.json(
      { success: false, error: { message: "Incorrect password." } },
      { status: 401 }
    );
  }

  if ("disabled" in result) {
    return NextResponse.json({ success: true, token: "", passwordDisabled: true });
  }

  const res = NextResponse.json({ success: true, token: result.token });
  res.cookies.set(gateCookieName("bbps"), result.token, gateCookieOptions());
  return res;
}
