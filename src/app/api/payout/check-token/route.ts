import { NextRequest, NextResponse } from "next/server";
import { isGateEnabled, isValidGateToken, gateCookieName } from "@/lib/access-gate";

/**
 * POST /api/payout/check-token — tell the UI whether the settlement gate is unlocked.
 * Source of truth is the httpOnly cookie set by /api/payout/unlock, so the UI's
 * lock state always matches what the API will actually accept.
 * If SETTLEMENT_PASSWORD is not set, the gate is disabled (always valid).
 */
export async function POST(req: NextRequest) {
  if (!isGateEnabled("settlement")) {
    return NextResponse.json({ valid: true, passwordDisabled: true });
  }

  const token = req.cookies.get(gateCookieName("settlement"))?.value;
  return NextResponse.json({ valid: isValidGateToken("settlement", token) });
}
