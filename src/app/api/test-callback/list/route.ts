import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CALLBACKS_FILE = path.join(os.tmpdir(), "test-callbacks.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(CALLBACKS_FILE, "utf-8");
    const callbacks: unknown[] = Array.isArray(JSON.parse(raw))
      ? JSON.parse(raw)
      : [];

    // Most recent first
    const reversed = [...callbacks].reverse();

    return NextResponse.json({
      success: true,
      total: reversed.length,
      callbacks: reversed,
    });
  } catch {
    return NextResponse.json({
      success: true,
      total: 0,
      callbacks: [],
    });
  }
}
