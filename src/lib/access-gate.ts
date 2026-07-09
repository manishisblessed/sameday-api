import { createHash } from "node:crypto";

/**
 * Server-side access gate for the sensitive dashboards (BBPS + Settlement).
 *
 * How it works:
 * - Each scope has its own password env var. Empty/unset => gate disabled.
 * - On a correct password we mint a daily-rotating token and store it in an
 *   httpOnly cookie. Page scripts can't read or forge it.
 * - `proxy.ts` verifies that cookie on every protected API request, so the gate
 *   is enforced on the actual money-moving endpoints — not just the browser UI.
 *
 * Token = SHA-256(`${secret}:${scope}:${YYYY-MM-DD}`).
 */

export type GateScope = "bbps" | "settlement";

const CONFIG: Record<GateScope, { env: "BBPS_PASSWORD" | "SETTLEMENT_PASSWORD"; cookie: string }> = {
  bbps: { env: "BBPS_PASSWORD", cookie: "bbps_gate" },
  settlement: { env: "SETTLEMENT_PASSWORD", cookie: "settlement_gate" },
};

export function gateCookieName(scope: GateScope): string {
  return CONFIG[scope].cookie;
}

function secretFor(scope: GateScope): string | undefined {
  const s = process.env[CONFIG[scope].env]?.trim();
  return s ? s : undefined;
}

export function isGateEnabled(scope: GateScope): boolean {
  return secretFor(scope) !== undefined;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Token to hand to the browser (and store in the cookie) after a correct password. */
export function gateToken(scope: GateScope, secret: string, date: string = today()): string {
  return createHash("sha256").update(`${secret}:${scope}:${date}`).digest("hex");
}

/**
 * Validate a token (from a cookie or the check-token body).
 * - Gate disabled → always valid.
 * - Gate enabled  → ONLY today's real token is accepted.
 */
export function isValidGateToken(scope: GateScope, token: string | null | undefined): boolean {
  const secret = secretFor(scope);
  if (!secret) return true;
  if (!token) return false;
  return token === gateToken(scope, secret);
}

/**
 * Check a submitted password.
 * @returns `{ disabled: true }` if the gate is off, a `{ token }` on success, or `null` on failure.
 */
export function verifyGatePassword(
  scope: GateScope,
  password: string | undefined
): { disabled: true } | { token: string } | null {
  const secret = secretFor(scope);
  if (!secret) return { disabled: true };
  const supplied = (password ?? "").trim();
  if (!supplied || supplied !== secret) return null;
  return { token: gateToken(scope, secret) };
}

/** Standard cookie options for the gate token. Session cookie: cleared when the browser closes. */
export function gateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}
