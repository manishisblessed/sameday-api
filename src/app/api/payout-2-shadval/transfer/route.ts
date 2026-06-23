import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const cd = body.contact_details as Record<string, string> | undefined;
  const payload: Record<string, unknown> = { ...body };

  if (cd) {
    if (cd.email) payload.contact_email = cd.email;
    if (cd.name) payload.contact_name = cd.name;
    if (cd.mobile) payload.contact_mobile = cd.mobile;
  }

  const result = await apiFetch("/api/partner/settlement/transfer", {
    method: "POST",
    body: payload,
  });
  return safeJsonResponse(result);
}
