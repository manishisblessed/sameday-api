import crypto from "node:crypto";

const BASE_URL = (process.env.API_BASE_URL || "").replace(/\/$/, "");
const API_KEY = process.env.API_KEY || "";
const API_SECRET = process.env.API_SECRET || "";

if (!BASE_URL || !API_KEY || !API_SECRET) {
  console.warn(
    "[api] Missing environment variables. Set API_BASE_URL, API_KEY, API_SECRET in .env.local"
  );
}

function hmacSign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export interface ApiResult<T = unknown> {
  status: number;
  ok: boolean;
  data: T;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; query?: Record<string, string> } = {}
): Promise<ApiResult<T>> {
  const method = (opts.method ?? "GET").toUpperCase();
  const url = new URL(path, BASE_URL);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v) url.searchParams.set(k, v);
    }
  }

  const timestamp = Date.now().toString();
  const headers: Record<string, string> = {
    "x-api-key": API_KEY,
    "x-timestamp": timestamp,
  };

  let bodyStr: string | undefined;
  if (method !== "GET" && method !== "HEAD" && opts.body != null) {
    bodyStr = JSON.stringify(opts.body);
    headers["Content-Type"] = "application/json";
    headers["x-signature"] = hmacSign(bodyStr + timestamp, API_SECRET);
  } else {
    headers["x-signature"] = hmacSign("" + timestamp, API_SECRET);
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: bodyStr,
    cache: "no-store",
  });

  const text = await res.text();
  let data: T;
  try {
    data = JSON.parse(text);
  } catch {
    data = text as unknown as T;
  }

  return { status: res.status, ok: res.ok, data };
}

export async function healthCheck() {
  const url = `${BASE_URL}/pos-health`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}
