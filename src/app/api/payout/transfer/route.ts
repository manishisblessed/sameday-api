import { NextRequest, NextResponse } from "next/server";
import { payoutService, PayoutServiceError } from "@/lib/payout-service";
import type { SdsPayoutTransferRequest } from "@/lib/types";

/**
 * POST /api/payout/transfer
 *
 * Initiates an IMPS/NEFT bank transfer via the Same Day Solution Payout API.
 *
 * Request body (all strings unless noted):
 *   accountNumber, ifscCode, accountHolderName, bankName, mobile (10-digit),
 *   amount (number ₹100–₹2,00,000), email?, paymentMode? ("IMPS"|"NEFT"),
 *   remarks?
 *
 * Caller may supply:
 *   x-idempotency-key: <unique string>   — prevents double-debit on retries
 *
 * IMPORTANT: On a 202 "UNKNOWN" response do NOT retry the transfer.
 * Instead, call GET /api/payout/status?transactionId=<id> to resolve the
 * actual outcome first.
 */
export async function POST(req: NextRequest) {
  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  // ── Basic validation ──────────────────────────────────────────────────────
  const required = [
    "accountNumber",
    "ifscCode",
    "accountHolderName",
    "bankName",
    "mobile",
    "amount",
  ] as const;

  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return NextResponse.json(
        { success: false, error: { message: `Missing required field: ${field}` } },
        { status: 400 },
      );
    }
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 100 || amount > 200_000) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "amount must be a number between ₹100 and ₹2,00,000" },
      },
      { status: 400 },
    );
  }

  const mobile = String(body.mobile).trim();
  if (!/^\d{10}$/.test(mobile)) {
    return NextResponse.json(
      { success: false, error: { message: "mobile must be a 10-digit Indian number" } },
      { status: 400 },
    );
  }

  // ── Idempotency key ───────────────────────────────────────────────────────
  // Accept from caller header; fall back to a server-generated one so every
  // transfer is tracked in the DB.
  const idempotencyKey =
    req.headers.get("x-idempotency-key") ||
    `auto-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  // ── Build typed request ───────────────────────────────────────────────────
  const transferReq: SdsPayoutTransferRequest & { idempotencyKey: string } = {
    accountNumber: String(body.accountNumber).trim(),
    ifscCode: String(body.ifscCode).trim().toUpperCase(),
    accountHolderName: String(body.accountHolderName).trim(),
    bankName: String(body.bankName).trim(),
    mobile,
    amount,
    email: body.email ? String(body.email).trim() : undefined,
    paymentMode:
      body.paymentMode === "NEFT" ? "NEFT" : "IMPS",
    remarks: body.remarks ? String(body.remarks).trim() : undefined,
    idempotencyKey,
  };

  // ── Call service ──────────────────────────────────────────────────────────
  try {
    const result = await payoutService.initiateTransfer(transferReq);

    if (result.status === "SUCCESS") {
      return NextResponse.json(result, { status: 200 });
    }
    if (result.status === "PENDING") {
      return NextResponse.json(result, { status: 200 });
    }
    // FAILED — amount auto-refunded
    return NextResponse.json(result, { status: 400 });
  } catch (err) {
    if (err instanceof PayoutServiceError) {
      if (err.code === "NETWORK_TIMEOUT") {
        // DO NOT retry — return 202 with provisional transaction_id so the
        // caller can poll checkStatus first.
        return NextResponse.json(
          {
            success: false,
            status: "UNKNOWN",
            message: err.message,
            transaction_id: err.transactionId,
          },
          { status: 202 },
        );
      }
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.httpStatus },
      );
    }
    console.error("[payout/transfer] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
