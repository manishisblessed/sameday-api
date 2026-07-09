import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  type GateScope,
  isGateEnabled,
  isValidGateToken,
  gateCookieName,
} from "@/lib/access-gate";

/**
 * Central access gate (Next.js 16 `proxy` convention — runs on the Node.js
 * runtime before requests reach route handlers). Enforces the BBPS and
 * Settlement passwords on the real API endpoints so the gate can't be bypassed
 * by hitting the API directly or tampering with the browser UI.
 */

/** Which gate (if any) protects a given API path. */
function scopeForPath(pathname: string): GateScope | null {
  // BBPS-1 bill payments + BBPS-2 (Pay2New) credit-card payments (via the upstream proxy).
  if (
    pathname.startsWith("/api/proxy/api/partner/bbps") ||
    pathname.startsWith("/api/proxy/api/partner/pay2new")
  ) {
    return "bbps";
  }

  // Settlement / payout endpoints. The unlock + check-token routes must stay open.
  if (pathname === "/api/payout/unlock" || pathname === "/api/payout/check-token") {
    return null;
  }
  if (pathname.startsWith("/api/payout") || pathname.startsWith("/api/payout-2-shadval")) {
    return "settlement";
  }

  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const scope = scopeForPath(pathname);

  if (scope && isGateEnabled(scope)) {
    const token = request.cookies.get(gateCookieName(scope))?.value;
    if (!isValidGateToken(scope, token)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GATE_LOCKED",
            message: `Access locked. Unlock the ${scope === "bbps" ? "BBPS" : "Settlement"} dashboard with your password.`,
          },
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
