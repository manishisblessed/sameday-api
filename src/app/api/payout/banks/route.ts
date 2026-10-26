import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";

export async function GET(req: NextRequest) {
  const query: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    query[k] = v;
  });

  try {
    const result = await apiFetch("/api/partner/payout/banks", {
      method: "GET",
      query,
    });

    // Log non-2xx upstream responses so we can diagnose in pm2 logs
    if (!result.ok) {
      console.error(
        `[payout/banks] Upstream returned ${result.status}:`,
        JSON.stringify(result.data).slice(0, 300),
      );
    }

    return safeJsonResponse(result);
  } catch (err) {
    // apiFetch throws on AbortError (timeout) or network-level failure.
    // Return a clean JSON error so the browser never sees a connection reset.
    const isTimeout =
      err instanceof Error &&
      (err.name === "AbortError" || err.message.includes("abort"));

    console.error("[payout/banks] Request failed:", err);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
          message: isTimeout
            ? "Bank list request timed out — please try again."
            : "Could not reach the bank list API. Please try again.",
        },
      },
      { status: 502 },
    );
  }
}
