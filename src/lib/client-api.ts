import type {
  TransactionResponse,
  TransactionFilters,
  MachineResponse,
  HealthResponse,
  ExportJobResponse,
  PayoutBalanceResponse,
  PayoutBanksResponse,
  PayoutBank,
  PayoutVerifyResponse,
  PayoutTransferResponse,
  PayoutStatusResponse,
  PayoutListResponse,
  PayoutVerifyRequest,
  PayoutTransferRequest,
} from "./types";

const PROXY = "/api/proxy";

async function request<T>(path: string, opts?: { method?: string; body?: unknown; query?: Record<string, string> }): Promise<T> {
  const method = opts?.method ?? "GET";
  let url = `${PROXY}${path}`;
  if (opts?.query) {
    const params = new URLSearchParams(opts.query);
    url += `?${params.toString()}`;
  }
  const res = await fetch(url, {
    method,
    headers: opts?.body ? { "Content-Type": "application/json" } : undefined,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  return request("/pos-health");
}

export async function fetchTransactions(filters: TransactionFilters): Promise<TransactionResponse> {
  return request("/api/partner/pos-transactions", { method: "POST", body: filters });
}

export async function fetchMachines(query?: Record<string, string>): Promise<MachineResponse> {
  return request("/api/partner/pos-machines", { query });
}

export async function createExportJob(body: { format: string; date_from: string; date_to: string; status?: string | null; terminal_id?: string | null }): Promise<ExportJobResponse> {
  return request("/api/partner/pos-transactions/export", { method: "POST", body });
}

export async function checkExportStatus(jobId: string): Promise<ExportJobResponse> {
  return request(`/api/partner/export-status/${jobId}`);
}

const PAYOUT = "/api/payout";

function payoutErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const o = data as { error?: { message?: string } | string; message?: string };
    if (typeof o.error === "object" && o.error?.message) return o.error.message;
    if (typeof o.error === "string") return o.error;
    if (typeof o.message === "string") return o.message;
  }
  return `Request failed (${status})`;
}

function coerceBool(v: unknown, defaultTrue: boolean): boolean {
  if (v === undefined || v === null) return defaultTrue;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no") return false;
  }
  return defaultTrue;
}

/** Map upstream bank rows to `PayoutBank` (handles `bank_name` / snake_case flags). */
function normalizePayoutBank(raw: unknown): PayoutBank | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const id = Number(b.id);
  if (!Number.isFinite(id)) return null;
  const nameCandidates = [
    b.name,
    b.bank_name,
    b.bankName,
    b.bank,
    b.label,
    b.title,
    b.display_name,
    b.displayName,
  ];
  let name = "";
  for (const c of nameCandidates) {
    if (typeof c === "string" && c.trim().length > 0) {
      name = c.trim();
      break;
    }
  }
  if (!name) name = `Bank #${id}`;
  const imps = coerceBool(b.imps ?? b.imps_enabled ?? b.is_imps, true);
  const neft = coerceBool(b.neft ?? b.neft_enabled ?? b.is_neft, true);
  return { id, name, imps, neft };
}

/** Fetch partner wallet balance (v3.0). */
export async function fetchPayoutBalance(): Promise<PayoutBalanceResponse> {
  const res = await fetch(`${PAYOUT}/balance`, { cache: "no-store" });
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return { success: false, error: { message: `Balance endpoint unavailable (HTTP ${res.status}).` } };
  }
  let data: PayoutBalanceResponse;
  try {
    data = (await res.json()) as PayoutBalanceResponse;
  } catch {
    return { success: false, error: { message: `Unexpected response (HTTP ${res.status}).` } };
  }
  if (!res.ok) {
    return { ...data, success: false, error: data.error ?? { message: payoutErrorMessage(data, res.status) } };
  }
  return data;
}

/** Bank list — returns JSON even on 403/401 so the UI can show API error text (e.g. missing payout permission). */
export async function fetchPayoutBanks(query?: Record<string, string | boolean | undefined>): Promise<PayoutBanksResponse> {
  const params = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      params.set(k, String(v));
    }
  }
  const q = params.toString();
  const url = `${PAYOUT}/banks${q ? `?${q}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  let data: PayoutBanksResponse;
  try {
    data = (await res.json()) as PayoutBanksResponse;
  } catch {
    return {
      success: false,
      error: { message: `Unexpected response (HTTP ${res.status}).` },
    };
  }
  if (!res.ok) {
    return {
      ...data,
      success: false,
      error: data.error ?? { message: payoutErrorMessage(data, res.status) },
    };
  }
  if (data.success && Array.isArray(data.banks)) {
    const banks = data.banks.map(normalizePayoutBank).filter((x): x is PayoutBank => x != null);
    return { ...data, banks };
  }
  return data;
}

export async function verifyPayoutAccount(body: PayoutVerifyRequest): Promise<PayoutVerifyResponse> {
  const res = await fetch(`${PAYOUT}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return (await res.json()) as PayoutVerifyResponse;
}

/** Initiate payout transfer (v3.0 — debits partner wallet, no merchant_id needed). */
export async function initiatePayoutTransfer(body: PayoutTransferRequest): Promise<PayoutTransferResponse> {
  const res = await fetch(`${PAYOUT}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return (await res.json()) as PayoutTransferResponse;
}

export async function getPayoutStatus(params: { transactionId?: string; clientRefId?: string }): Promise<PayoutStatusResponse> {
  const search = new URLSearchParams();
  if (params.transactionId) search.set("transactionId", params.transactionId);
  if (params.clientRefId) search.set("clientRefId", params.clientRefId);
  const q = search.toString();
  if (!q) throw new Error("transactionId or clientRefId required");
  const res = await fetch(`${PAYOUT}/status?${q}`, { cache: "no-store" });
  return (await res.json()) as PayoutStatusResponse;
}

/** Last ~20 payouts for the partner (v3.0 — no merchant_id needed). */
export async function listRecentPayouts(): Promise<PayoutListResponse> {
  const res = await fetch(`${PAYOUT}/list`, { cache: "no-store" });
  try {
    return (await res.json()) as PayoutListResponse;
  } catch {
    return {
      success: false,
      error: { message: `Could not read payout list (HTTP ${res.status}).` },
    };
  }
}
