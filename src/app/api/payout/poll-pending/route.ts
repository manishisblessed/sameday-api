import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/lib/payout-service";

/**
 * GET /api/payout/poll-pending
 *
 * Background job — polls all PENDING / UNKNOWN transactions older than 2 min
 * and updates their status via Same Day Solution's Check Status endpoint.
 *
 * Protect this route with the POLL_SECRET env var.  Call it from an external
 * cron service (cron-job.org, GitHub Actions, Vercel Cron, etc.):
 *
 *   GET https://your-domain/api/payout/poll-pending
 *   Authorization: Bearer <POLL_SECRET>
 *
 * Example cron schedule: every 5 minutes.
 *
 * If POLL_SECRET is not set, the route is disabled (returns 403) to prevent
 * accidental exposure.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.POLL_SECRET?.trim();

  // Require the secret to be configured
  if (!secret) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "POLL_SECRET is not set. Configure it in .env.local to enable this endpoint.",
        },
      },
      { status: 403 },
    );
  }

  // Validate the caller's token
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== secret) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  // Optional: how old (in minutes) a PENDING row must be before it's polled
  const olderThanParam = req.nextUrl.searchParams.get("olderThan");
  const olderThanMinutes = Math.max(Number(olderThanParam) || 2, 1);

  try {
    const summary = await payoutService.pollPending(olderThanMinutes);

    return NextResponse.json({
      success: true,
      polled: summary.polled,
      updated: summary.updated,
      errors: summary.errors,
      olderThanMinutes,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[payout/poll-pending] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: { message: "Poll job failed" } },
      { status: 500 },
    );
  }
}
