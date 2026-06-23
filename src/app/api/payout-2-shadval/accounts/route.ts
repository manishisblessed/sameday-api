import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { safeJsonResponse } from "@/lib/api-status";

export async function GET() {
  const result = await apiFetch("/api/partner/settlement/accounts", {
    method: "GET",
  });
  return safeJsonResponse(result);
}

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

  const result = await apiFetch("/api/partner/settlement/accounts", {
    method: "POST",
    body,
  });
  return safeJsonResponse(result);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: { message: "Account ID is required" } },
      { status: 400 }
    );
  }

  const result = await apiFetch("/api/partner/settlement/accounts", {
    method: "DELETE",
    query: { id },
  });
  return safeJsonResponse(result);
}
