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
