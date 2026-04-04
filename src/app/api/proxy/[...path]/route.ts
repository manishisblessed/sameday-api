import { NextRequest, NextResponse } from "next/server";
import { apiFetch, healthCheck } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const joined = "/" + path.join("/");

  if (joined === "/pos-health") {
    const result = await healthCheck();
    return NextResponse.json(result.data, { status: result.status });
  }

  const query: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    query[k] = v;
  });

  const result = await apiFetch(joined, { method: "GET", query });
  return NextResponse.json(result.data, { status: result.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const joined = "/" + path.join("/");

  let body: unknown;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await apiFetch(joined, { method: "POST", body });
  return NextResponse.json(result.data, { status: result.status });
}
