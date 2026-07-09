import { NextRequest, NextResponse } from "next/server";
import { isGateEnabled, isValidGateToken, gateCookieName } from "@/lib/access-gate";

/**
 * POST /api/bbps/check-token — tell the UI whether the BBPS gate is unlocked.
 * Source of truth is the httpOnly cookie set by /api/bbps/unlock, so the UI's
 * lock state always matches what the API will actually accept.
 * If BBPS_PASSWORD is not set, the gate is disabled (always valid).
 */
export async function POST(req: NextRequest) {
  if (!isGateEnabled("bbps")) {
    return NextResponse.json({ valid: true, passwordDisabled: true });
  }

  const token = req.cookies.get(gateCookieName("bbps"))?.value;
  return NextResponse.json({ valid: isValidGateToken("bbps", token) });
}
