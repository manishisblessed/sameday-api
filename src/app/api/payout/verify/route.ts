import { NextResponse } from "next/server";

/**
 * This endpoint does not exist in the Same Day Solution Payout API v3.0.
 *
 * There is NO separate account verification or beneficiary registration step.
 * Beneficiary registration is handled internally on the first transfer to a
 * new account. A one-time ₹4.72 verification charge appears in the transfer
 * response (`verification_charge` field) for new beneficiaries.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "ENDPOINT_REMOVED",
        message:
          "Account verification is not a separate step in v3.0. " +
          "Beneficiary registration happens automatically on the first transfer. " +
          "Use POST /api/payout/transfer directly.",
      },
    },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "ENDPOINT_REMOVED",
        message:
          "Account verification is not a separate step in v3.0. " +
          "Beneficiary registration happens automatically on the first transfer. " +
          "Use POST /api/payout/transfer directly.",
      },
    },
    { status: 410 },
  );
}
