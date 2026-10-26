import { NextRequest, NextResponse } from "next/server";
import { isKnownBeneficiary } from "@/lib/payout-db";

/**
 * GET /api/payout/check-beneficiary?accountNumber=<acct>
 *
 * Checks our local SQLite DB for a prior SUCCESS transfer to this account.
 *  isNew = true  → first transfer; ₹4.72 registration fee will be charged by SDS
 *  isNew = false → repeat beneficiary; no extra fee
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const accountNumber = req.nextUrl.searchParams.get("accountNumber")?.trim();

  if (!accountNumber) {
    return NextResponse.json(
      { success: false, error: { message: "accountNumber query param is required" } },
      { status: 400 },
    );
  }

  try {
    const known = isKnownBeneficiary(accountNumber);
    return NextResponse.json({
      success: true,
      isNew: !known,
      accountNumber,
      verificationCharge: known ? 0 : 4.72,
      message: known
        ? "Repeat beneficiary — no registration fee."
        : "New beneficiary — a one-time ₹4.72 registration fee will be charged.",
    });
  } catch (err) {
    console.error("[check-beneficiary] DB error:", err);
    // On DB error, default to isNew=true so the confirmation is always shown
    return NextResponse.json({
      success: true,
      isNew: true,
      accountNumber,
      verificationCharge: 4.72,
      message: "Could not verify beneficiary status — registration fee may apply.",
    });
  }
}
