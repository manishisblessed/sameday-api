import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CALLBACKS_FILE = path.join(os.tmpdir(), "test-callbacks.json");
const MAX_ENTRIES = 50;

function readCallbacks(): unknown[] {
  try {
    const raw = fs.readFileSync(CALLBACKS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCallbacks(callbacks: unknown[]): void {
  fs.writeFileSync(CALLBACKS_FILE, JSON.stringify(callbacks, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      payload = { raw: await req.text() };
    }

    console.log("[test-callback] Received:", JSON.stringify(payload, null, 2));

    const callbacks = readCallbacks();
    callbacks.push({
      receivedAt: new Date().toISOString(),
      payload,
    });

    // Keep only the last N entries
    const trimmed = callbacks.slice(-MAX_ENTRIES);
    writeCallbacks(trimmed);
  } catch (err) {
    console.error("[test-callback] Error processing callback:", err);
  }

  return NextResponse.json({
    status: "success",
    message: "Transaction received",
  });
}
