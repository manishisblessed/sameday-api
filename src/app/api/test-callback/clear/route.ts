import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CALLBACKS_FILE = path.join(os.tmpdir(), "test-callbacks.json");

export async function DELETE() {
  let cleared = 0;

  try {
    const raw = fs.readFileSync(CALLBACKS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    cleared = Array.isArray(parsed) ? parsed.length : 0;
    fs.unlinkSync(CALLBACKS_FILE);
  } catch {
    // File doesn't exist or is unreadable — nothing to clear
  }

  return NextResponse.json({
    success: true,
    message: `Cleared ${cleared} callbacks`,
  });
}
