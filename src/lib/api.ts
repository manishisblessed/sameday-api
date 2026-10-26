import crypto from "node:crypto";

const BASE_URL = (process.env.API_BASE_URL || "").replace(/\/$/, "");
const API_KEY = process.env.API_KEY || "";
const API_SECRET = process.env.API_SECRET || "";

if (!BASE_URL || !API_KEY || !API_SECRET) {
  console.warn(
    "[api] Missing environment variables. Set API_BASE_URL, API_KEY, API_SECRET in .env.local"
  );
}

/** HMAC-SHA256 hex signature — payload must be compact JSON (no spaces). */
function hmacSign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export interface ApiResult<T = unknown> {
  status: number;
  ok: boolean;
  data: T;
}

export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string>;
  /**
   * Extra request headers merged after the auth headers.
   * Use this to pass e.g. `x-idempotency-key` for the transfer endpoint.
   */
  extraHeaders?: Record<string, string>;
  /**
   * Request timeout in milliseconds.  Defaults to 30 000 ms.
   * When the timeout fires the promise rejects with a `DOMException` whose
   * `name === "AbortError"`.
   */
  timeoutMs?: number;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {}
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
    // JSON.stringify produces compact JSON (no spaces) — required for correct HMAC
    bodyStr = JSON.stringify(opts.body);
    headers["Content-Type"] = "application/json";
    headers["x-signature"] = hmacSign(bodyStr + timestamp, API_SECRET);
  } else {
    headers["x-signature"] = hmacSign("" + timestamp, API_SECRET);
  }

  // Merge any caller-supplied extra headers (e.g. x-idempotency-key)
  if (opts.extraHeaders) {
    Object.assign(headers, opts.extraHeaders);
  }

  // Abort controller for timeout
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: bodyStr,
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await res.text();
    let data: T;
    try {
      data = JSON.parse(text);
    } catch {
      data = text as unknown as T;
    }

    return { status: res.status, ok: res.ok, data };
  } finally {
    clearTimeout(timer);
  }
}

export async function healthCheck() {
  const url = `${BASE_URL}/pos-health`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}
