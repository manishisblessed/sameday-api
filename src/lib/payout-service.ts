/**
 * payout-service.ts
 *
 * Server-side payout service for Same Day Solution Payout API (v3.0).
 *
 * Usage (route handlers only — never import in Client Components):
 *
 *   import { payoutService } from "@/lib/payout-service";
 *
 *   const balance = await payoutService.getBalance();
 *   const txn     = await payoutService.initiateTransfer({ ... });
 *   const status  = await payoutService.checkStatus(txn.transaction_id!);
 *   const list    = await payoutService.listTransactions(20);
 *
 * Error handling:
 *   All methods throw `PayoutServiceError` on unrecoverable failures.
 *   Network timeout from initiateTransfer throws with code "NETWORK_TIMEOUT"
 *   and the provisional `transaction_id` (saved to DB with status UNKNOWN).
 *   The caller MUST call checkStatus() to resolve the actual outcome before
 *   retrying the transfer.
 */

import { apiFetch } from "./api";
import {
  insertTransaction,
  updateTransactionStatus,
  findByIdempotencyKey,
  findPendingTransactions,
} from "./payout-db";
import type {
  PayoutBalanceResponse,
  SdsPayoutTransferRequest,
  SdsPayoutTransferResponse,
  SdsPayoutStatusResponse,
  SdsPayoutListResponse,
} from "./types";

// ─── Typed error ──────────────────────────────────────────────────────────────

export class PayoutServiceError extends Error {
  constructor(
    /** Machine-readable code matching the API spec (e.g. UNAUTHORIZED, 503). */
    public readonly code: string,
    message: string,
    public readonly httpStatus: number = 400,
    /** Set when code === "NETWORK_TIMEOUT" — the provisional DB row ID. */
    public readonly transactionId?: string,
  ) {
    super(message);
    this.name = "PayoutServiceError";
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Delay `ms` milliseconds (used for exponential back-off). */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run `fn` with exponential back-off retries on HTTP 503.
 * Spec: max 3 attempts, 30 s apart.
 */
async function withBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 30_000,
): Promise<T> {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      return await fn();
    } catch (err) {
      const is503 =
        err instanceof PayoutServiceError && err.httpStatus === 503;
      if (!is503 || attempt >= maxAttempts) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 30s, 60s, 120s
      console.warn(
        `[payout] 503 SERVICE_UNAVAILABLE — retry ${attempt}/${maxAttempts} in ${delay / 1000}s`,
      );
      await sleep(delay);
    }
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const payoutService = {
  // ── 1. Get wallet balance ────────────────────────────────────────────────

  async getBalance(): Promise<PayoutBalanceResponse> {
    const result = await withBackoff(() =>
      apiFetch<PayoutBalanceResponse>("/api/partner/payout/balance", {
        method: "GET",
      }).then((r) => {
        if (r.status === 503) {
          throw new PayoutServiceError(
            "SERVICE_UNAVAILABLE",
            "Provider down — retry in a few minutes.",
            503,
          );
        }
        if (r.status === 401) {
          console.error(
            "[payout] 401 UNAUTHORIZED — check API key, signature, clock skew, or IP whitelist",
          );
          throw new PayoutServiceError(
            "UNAUTHORIZED",
            r.data?.error?.message ??
              "Unauthorized — check API key and IP whitelist.",
            401,
          );
        }
        return r.data;
      }),
    );
    return result;
  },

  // ── 2. Initiate transfer ─────────────────────────────────────────────────

  /**
   * Initiate an IMPS/NEFT bank transfer.
   *
   * @param params  Transfer parameters + optional `idempotencyKey`.
   *
   * Important behaviours:
   *  - Saves the transaction to the DB **before** returning (status unknown
   *    transitions to PENDING/SUCCESS/FAILED once the API responds).
   *  - If the API returns a duplicate/cooldown 429, the PayoutServiceError
   *    carries code "DUPLICATE".
   *  - On a network timeout an UNKNOWN row is inserted and the error carries
   *    code "NETWORK_TIMEOUT" plus the provisional `transactionId`.
   *    The caller MUST call `checkStatus()` before any retry.
   */
  async initiateTransfer(
    params: SdsPayoutTransferRequest & { idempotencyKey?: string },
  ): Promise<SdsPayoutTransferResponse> {
    const { idempotencyKey, ...body } = params;

    // ── Idempotency guard ──────────────────────────────────────────────────
    if (idempotencyKey) {
      const existing = findByIdempotencyKey(idempotencyKey);
      if (existing) {
        console.log(
          `[payout] Idempotency hit — returning existing txn ${existing.transaction_id}`,
        );
        return {
          success: true,
          message: "Duplicate request — returning existing transaction.",
          transaction_id: existing.transaction_id,
          partner_trans_id: existing.partner_trans_id ?? undefined,
          utr: existing.utr ?? undefined,
          status: existing.status as "SUCCESS" | "PENDING" | "FAILED",
          amount: existing.amount,
          payment_mode: existing.payment_mode,
          account_number: existing.account_number,
          account_holder_name: existing.account_holder_name,
          bank_name: existing.bank_name,
        };
      }
    }

    // ── Build extra headers ────────────────────────────────────────────────
    const extraHeaders: Record<string, string> = {};
    if (idempotencyKey) {
      extraHeaders["x-idempotency-key"] = idempotencyKey;
    }

    // ── Call upstream with backoff ─────────────────────────────────────────
    let apiResult: Awaited<ReturnType<typeof apiFetch<SdsPayoutTransferResponse>>>;
    try {
      apiResult = await withBackoff(() =>
        apiFetch<SdsPayoutTransferResponse>(
          "/api/partner/payout/transfer",
          {
            method: "POST",
            body,
            extraHeaders,
            // Give payout a generous 45 s window before we treat it as a
            // network timeout (the spec says to check status, not retry).
            timeoutMs: 45_000,
          },
        ).then((r) => {
          if (r.status === 503) {
            throw new PayoutServiceError(
              "SERVICE_UNAVAILABLE",
              "Provider down — retry in a few minutes.",
              503,
            );
          }
          return r;
        }),
      );
    } catch (err) {
      // AbortError = our 45 s timeout fired
      const isTimeout =
        (err instanceof DOMException && err.name === "AbortError") ||
        (err instanceof Error && err.name === "AbortError");

      if (isTimeout) {
        const provisionalId = `unknown-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        const now = new Date().toISOString();
        insertTransaction({
          transaction_id: provisionalId,
          partner_trans_id: null,
          utr: null,
          account_number: body.accountNumber,
          ifsc_code: body.ifscCode,
          account_holder_name: body.accountHolderName,
          bank_name: body.bankName,
          mobile: body.mobile,
          amount: body.amount,
          payment_mode: body.paymentMode ?? "IMPS",
          status: "UNKNOWN",
          idempotency_key: idempotencyKey ?? null,
          created_at: now,
        });
        console.error(
          `[payout] Network timeout — provisional row saved: ${provisionalId}. ` +
            "CALL checkStatus() before retrying.",
        );
        throw new PayoutServiceError(
          "NETWORK_TIMEOUT",
          "Transfer status unknown due to network timeout. " +
            "Call checkStatus() with the provisional transaction_id before retrying.",
          504,
          provisionalId,
        );
      }
      throw err; // SERVICE_UNAVAILABLE exhausted retries — re-throw
    }

    // ── Handle auth / permission errors ───────────────────────────────────
    if (apiResult.status === 401) {
      console.error(
        "[payout] 401 UNAUTHORIZED — check API key, signature, clock skew, or IP whitelist",
      );
      throw new PayoutServiceError(
        "UNAUTHORIZED",
        apiResult.data?.error?.message ??
          "Unauthorized — check API key and IP whitelist.",
        401,
      );
    }
    if (apiResult.status === 403) {
      const code = (apiResult.data as { error?: { code?: string } })?.error?.code;
      if (code === "WALLET_FROZEN") {
        throw new PayoutServiceError(
          "WALLET_FROZEN",
          "Wallet is frozen — contact admin.",
          403,
        );
      }
      throw new PayoutServiceError(
        "FORBIDDEN",
        "Payout feature not enabled — contact Same Day Solution admin.",
        403,
      );
    }
    if (apiResult.status === 429) {
      throw new PayoutServiceError(
        "DUPLICATE",
        apiResult.data?.message ?? "60-second cooldown active — wait and retry.",
        429,
      );
    }

    const data = apiResult.data;
    const txnId = data.transaction_id;

    // ── Persist to DB immediately ──────────────────────────────────────────
    if (txnId) {
      const now = new Date().toISOString();
      insertTransaction({
        transaction_id: txnId,
        partner_trans_id: data.partner_trans_id ?? null,
        utr: data.utr ?? null,
        account_number: data.account_number ?? body.accountNumber,
        ifsc_code: body.ifscCode,
        account_holder_name:
          data.account_holder_name ?? body.accountHolderName,
        bank_name: data.bank_name ?? body.bankName,
        mobile: body.mobile,
        amount: data.amount ?? body.amount,
        payment_mode: data.payment_mode ?? body.paymentMode ?? "IMPS",
        status: data.status ?? (data.success ? "PENDING" : "FAILED"),
        idempotency_key: idempotencyKey ?? null,
        created_at: now,
      });
    }

    // ── Log terminal states ────────────────────────────────────────────────
    if (data.status === "FAILED") {
      console.warn(
        `[payout] Transfer FAILED txn=${txnId ?? "unknown"} — auto-refunded to wallet.`,
      );
    } else if (data.status === "PENDING") {
      console.log(`[payout] Transfer PENDING txn=${txnId} — polling required.`);
    } else if (data.status === "SUCCESS") {
      console.log(
        `[payout] Transfer SUCCESS txn=${txnId} UTR=${data.utr ?? "n/a"}`,
      );
    }

    return data;
  },

  // ── 3. Check transaction status ──────────────────────────────────────────

  /**
   * Poll the status of a payout.
   * Automatically updates the DB row when a terminal status is received.
   *
   * @param transactionId  The UUID returned by initiateTransfer.
   * @param partnerTransId Optional — alternative lookup by partner_trans_id.
   */
  async checkStatus(
    transactionId: string,
    partnerTransId?: string,
  ): Promise<SdsPayoutStatusResponse> {
    const query: Record<string, string> = {};
    if (transactionId) query.transactionId = transactionId;
    if (partnerTransId) query.partnerTransId = partnerTransId;

    const result = await apiFetch<SdsPayoutStatusResponse>(
      "/api/partner/payout/status",
      { method: "GET", query },
    );

    const data = result.data;

    if (data.success && data.transaction) {
      const t = data.transaction;
      // Update persisted row with latest status
      updateTransactionStatus(
        transactionId,
        t.status,
        t.utr ?? null,
        t.partner_trans_id ?? null,
      );

      if (t.status === "FAILED") {
        console.warn(
          `[payout] Status check — FAILED txn=${transactionId} — auto-refunded.`,
        );
      }
    }

    return data;
  },

  // ── 4. List recent transactions ──────────────────────────────────────────

  /** Fetch the most recent payout transactions from the upstream API. */
  async listTransactions(
    limit = 20,
  ): Promise<SdsPayoutListResponse> {
    const result = await apiFetch<SdsPayoutListResponse>(
      "/api/partner/payout/status",
      {
        method: "GET",
        query: { list: "true", limit: String(Math.min(limit, 50)) },
      },
    );
    return result.data;
  },

  // ── Pending handler (called by poll-pending route) ───────────────────────

  /**
   * Poll all PENDING/UNKNOWN DB rows older than `olderThanMinutes` minutes.
   * Returns a summary: { polled, updated, errors }.
   */
  async pollPending(olderThanMinutes = 2): Promise<{
    polled: number;
    updated: number;
    errors: number;
  }> {
    const rows = findPendingTransactions(olderThanMinutes);
    let updated = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const res = await this.checkStatus(row.transaction_id);
        if (res.success && res.transaction) {
          updated++;
          console.log(
            `[payout:poll] Updated txn=${row.transaction_id} → ${res.transaction.status}`,
          );
        }
      } catch (err) {
        errors++;
        console.error(
          `[payout:poll] Failed to check txn=${row.transaction_id}:`,
          err,
        );
      }
    }

    return { polled: rows.length, updated, errors };
  },
};
