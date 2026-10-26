import { NextResponse } from "next/server";

/**
 * The bank-list endpoint does not exist in the Same Day Solution Payout API v3.0.
 *
 * v3.0 accepts `bankName` as a plain string — no bank ID or lookup required.
 * The bank name is auto-derived from the IFSC code prefix on the client.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "ENDPOINT_REMOVED",
        message:
          "The bank list endpoint does not exist in v3.0. " +
          "Pass bankName as a plain string in the transfer request (e.g. 'AXIS BANK'). " +
          "Derive the bank name from the IFSC code prefix.",
      },
    },
    { status: 410 },
  );
}
