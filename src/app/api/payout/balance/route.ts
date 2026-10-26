import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";

/** Get partner wallet balance (v3.0 — dedicated partner wallet). */
export async function GET() {
  try {
    const result = await apiFetch("/api/partner/payout/balance", {
      method: "GET",
    });

    if (!result.ok) {
      console.error(
        `[payout/balance] Upstream returned ${result.status}:`,
        JSON.stringify(result.data).slice(0, 300),
      );
    }

    return safeJsonResponse(result);
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "AbortError" || err.message.includes("abort"));

    console.error("[payout/balance] Request failed:", err);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
          message: isTimeout
            ? "Balance request timed out — please try again."
            : "Could not reach the balance API. Please try again.",
        },
      },
      { status: 502 },
    );
  }
}
