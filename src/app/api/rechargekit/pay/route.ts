import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";
import { isValidCardNumber, isValidMobile } from "@/lib/rechargekit-validation";
import type { RechargeKitPayRequest, RechargeKitPayResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json(
    { success: false, error: { code: "BAD_REQUEST", message } },
    { status: 400 }
  );
}

/**
 * POST /api/rechargekit/pay — process a direct credit-card payment (CC-2).
 *
 * Validates mobile/card before hitting the provider and logs the request_id +
 * txn_id from the response for reconciliation. NEVER retried on timeout — the
 * client falls back to /status with the request_id instead.
 */
export async function POST(req: NextRequest) {
  let body: Partial<RechargeKitPayRequest> = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return badRequest("Invalid JSON body");
  }

  const mobile_no = String(body.mobile_no ?? "").trim();
  const account_no = String(body.account_no ?? "").replace(/\s+/g, "");
  const ifsc = String(body.ifsc ?? "").trim();
  const bank_name = String(body.bank_name ?? "").trim();
  const beneficiary_name = String(body.beneficiary_name ?? "").trim();
  const operator_code = String(body.operator_code ?? "").trim();
  const amount = Number(body.amount);

  if (!mobile_no || !account_no || !ifsc || !bank_name || !beneficiary_name || !operator_code) {
    return badRequest(
      "All fields required: mobile_no, account_no, ifsc, bank_name, beneficiary_name, amount, operator_code"
    );
  }
  if (!isValidMobile(mobile_no)) {
    return badRequest("mobile_no must be a 10-digit number");
  }
  if (!isValidCardNumber(account_no)) {
    return badRequest("account_no must be a valid credit card number");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return badRequest("amount must be a positive number");
  }

  const payload: RechargeKitPayRequest = {
    mobile_no,
    account_no,
    ifsc,
    bank_name,
    beneficiary_name,
    amount,
    operator_code,
  };

  const result = await apiFetch<RechargeKitPayResponse>("/api/partner/rechargekit/pay", {
    method: "POST",
    body: payload,
  });

  // Reconciliation log — never log the full card number.
  const d = (typeof result.data === "object" && result.data) || {};
  console.log(
    "[rechargekit/pay]",
    JSON.stringify({
      http: result.status,
      success: (d as RechargeKitPayResponse).success,
      status: (d as RechargeKitPayResponse).status,
      request_id: (d as RechargeKitPayResponse).request_id,
      txn_id: (d as RechargeKitPayResponse).txn_id,
      operator_reference: (d as RechargeKitPayResponse).operator_reference,
      amount: (d as RechargeKitPayResponse).amount,
      charge: (d as RechargeKitPayResponse).charge,
      card_last4: account_no.slice(-4),
      operator_code,
    })
  );

  return safeJsonResponse(result);
}
