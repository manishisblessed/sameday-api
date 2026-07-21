import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeStatus } from "@/lib/api-status";
import type { RechargeKitOperatorsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/rechargekit/operators — list CC operators for RechargeKit (CC-2).
 *
 * The upstream list is stable, so we cache it in-memory for 24h to avoid
 * calling it on every payment (requirement: cache, refresh daily/on-demand).
 * Pass `?refresh=true` to force a fresh fetch.
 */

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

let cache: { data: RechargeKitOperatorsResponse; at: number } | null = null;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  const now = Date.now();
  if (!forceRefresh && cache && now - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(
      { ...cache.data, cached: true, cached_at: new Date(cache.at).toISOString() },
      { status: 200 }
    );
  }

  const result = await apiFetch<RechargeKitOperatorsResponse>(
    "/api/partner/rechargekit/operators",
    { method: "GET" }
  );

  const status = safeStatus(result.status);

  // Only cache a genuinely successful, non-empty operator list.
  if (
    result.ok &&
    result.data &&
    typeof result.data === "object" &&
    result.data.success &&
    Array.isArray(result.data.operators)
  ) {
    cache = { data: result.data, at: now };
    return NextResponse.json(
      { ...result.data, cached: false, cached_at: new Date(now).toISOString() },
      { status }
    );
  }

  // Upstream returned an error (or HTML) — surface a clean JSON error and don't cache it.
  if (typeof result.data === "string" || !result.data) {
    return NextResponse.json(
      { success: false, error: { message: `Operators unavailable (HTTP ${result.status}).` } },
      { status }
    );
  }

  return NextResponse.json(result.data, { status });
}
