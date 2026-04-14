import { NextResponse } from "next/server";
import type { ApiResult } from "./api";

/**
 * Next.js App Router intercepts certain status codes (404, 308, etc.) and
 * renders its own HTML pages instead of returning JSON from API routes.
 * This helper remaps those codes so JSON responses are always preserved.
 */
export function safeStatus(upstream: number): number {
  if (upstream === 404) return 502;
  if (upstream === 308) return 502;
  return upstream;
}

/**
 * Wraps an upstream `apiFetch` result into a guaranteed JSON NextResponse.
 * If the upstream returned HTML (e.g. a 404 page), this returns a clean
 * JSON error instead of forwarding the HTML body.
 */
export function safeJsonResponse(result: ApiResult): NextResponse {
  const status = safeStatus(result.status);

  if (typeof result.data === "string" && result.data.trimStart().startsWith("<!")) {
    return NextResponse.json(
      { success: false, error: { message: `Upstream returned ${result.status}` } },
      { status }
    );
  }

  return NextResponse.json(result.data, { status });
}
