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
  ShadvalBalanceResponse,
  ShadvalAccountsResponse,
  ShadvalAddAccountRequest,
  ShadvalAddAccountResponse,
  ShadvalChargesResponse,
  ShadvalTransferRequest,
  ShadvalTransferResponse,
  ShadvalStatusResponse,
  ShadvalListResponse,
  BbpsCategoriesResponse,
  BbpsBillersResponse,
  BbpsBillerInfoResponse,
  BbpsFetchBillRequest,
  BbpsFetchBillResponse,
  BbpsPayBillRequest,
  BbpsPayBillResponse,
  BbpsTransactionStatusRequest,
  BbpsTransactionStatusResponse,
  BbpsComplaintRegisterRequest,
  BbpsComplaintRegisterResponse,
  BbpsComplaintTrackRequest,
  BbpsComplaintTrackResponse,
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

// ─── SHADVAL Settlement-2 API ────────────────────────────────────────────────

const SHADVAL = "/api/payout-2-shadval";

export async function fetchShadvalBalance(): Promise<ShadvalBalanceResponse> {
  const res = await fetch(`${SHADVAL}/balance`, { cache: "no-store" });
  try {
    return (await res.json()) as ShadvalBalanceResponse;
  } catch {
    return { success: false, error: { message: `Balance unavailable (HTTP ${res.status}).` } };
  }
}

export async function fetchShadvalAccounts(): Promise<ShadvalAccountsResponse> {
  const res = await fetch(`${SHADVAL}/accounts`, { cache: "no-store" });
  try {
    return (await res.json()) as ShadvalAccountsResponse;
  } catch {
    return { success: false, error: { message: `Could not load accounts (HTTP ${res.status}).` } };
  }
}

export async function addShadvalAccount(body: ShadvalAddAccountRequest): Promise<ShadvalAddAccountResponse> {
  const res = await fetch(`${SHADVAL}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  try {
    return (await res.json()) as ShadvalAddAccountResponse;
  } catch {
    return { success: false, error: { message: `Add account failed (HTTP ${res.status}).` } };
  }
}

export async function deleteShadvalAccount(id: string): Promise<{ success: boolean; message?: string; error?: { message?: string } }> {
  const res = await fetch(`${SHADVAL}/accounts?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    cache: "no-store",
  });
  try {
    return await res.json();
  } catch {
    return { success: false, error: { message: `Delete failed (HTTP ${res.status}).` } };
  }
}

export async function fetchShadvalCharges(amount: number, mode: string = "IMPS"): Promise<ShadvalChargesResponse> {
  const res = await fetch(`${SHADVAL}/charges?amount=${amount}&mode=${mode}`, { cache: "no-store" });
  try {
    return (await res.json()) as ShadvalChargesResponse;
  } catch {
    return { success: false, error: { message: `Charges unavailable (HTTP ${res.status}).` } };
  }
}

export async function initiateShadvalTransfer(body: ShadvalTransferRequest): Promise<ShadvalTransferResponse> {
  const res = await fetch(`${SHADVAL}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  try {
    return (await res.json()) as ShadvalTransferResponse;
  } catch {
    return { success: false, error: { message: `Transfer failed (HTTP ${res.status}).` } };
  }
}

export async function getShadvalStatus(referenceId: string): Promise<ShadvalStatusResponse> {
  const res = await fetch(`${SHADVAL}/status?reference_id=${encodeURIComponent(referenceId)}`, { cache: "no-store" });
  try {
    return (await res.json()) as ShadvalStatusResponse;
  } catch {
    return { success: false, error: { message: `Status unavailable (HTTP ${res.status}).` } };
  }
}

export async function listShadvalTransactions(limit: number = 20): Promise<ShadvalListResponse> {
  const res = await fetch(`${SHADVAL}/status?list=true&limit=${limit}`, { cache: "no-store" });
  try {
    return (await res.json()) as ShadvalListResponse;
  } catch {
    return { success: false, error: { message: `Could not load transactions (HTTP ${res.status}).` } };
  }
}

// ─── BBPS Bill Payment API ───────────────────────────────────────────────────

const BBPS_PROXY = "/api/proxy/api/partner/bbps";

export async function fetchBbpsCategories(): Promise<BbpsCategoriesResponse> {
  const res = await fetch(`${BBPS_PROXY}/categories`, { cache: "no-store" });
  try {
    return (await res.json()) as BbpsCategoriesResponse;
  } catch {
    return { success: false, error: { message: `Categories unavailable (HTTP ${res.status}).` } };
  }
}

export async function fetchBbpsBillers(category: string): Promise<BbpsBillersResponse> {
  const res = await fetch(`${BBPS_PROXY}/billers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category,
      paymentChannelName1: "INT",
      paymentChannelName2: "AGT",
      paymentChannelName3: "",
    }),
    cache: "no-store",
  });
  try {
    return (await res.json()) as BbpsBillersResponse;
  } catch {
    return { success: false, error: { message: `Billers unavailable (HTTP ${res.status}).` } };
  }
}

export async function fetchBbpsBillerInfo(biller_id: string): Promise<BbpsBillerInfoResponse> {
  const res = await fetch(`${BBPS_PROXY}/biller-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ biller_id }),
    cache: "no-store",
  });
  try {
    return (await res.json()) as BbpsBillerInfoResponse;
  } catch {
    return { success: false, error: { message: `Biller info unavailable (HTTP ${res.status}).` } };
  }
}

export async function fetchBbpsBill(body: BbpsFetchBillRequest): Promise<BbpsFetchBillResponse> {
  const res = await fetch(`${BBPS_PROXY}/bill/fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  try {
    return (await res.json()) as BbpsFetchBillResponse;
  } catch {
    return { success: false, error: { message: `Bill fetch failed (HTTP ${res.status}).` } };
  }
}

export async function payBbpsBill(body: BbpsPayBillRequest): Promise<BbpsPayBillResponse> {
  const res = await fetch(`${BBPS_PROXY}/bill/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  try {
    return (await res.json()) as BbpsPayBillResponse;
  } catch {
    return { success: false, error: { message: `Payment failed (HTTP ${res.status}).` } };
  }
}

export async function fetchBbpsTransactionStatus(body: BbpsTransactionStatusRequest): Promise<BbpsTransactionStatusResponse> {
  const res = await fetch(`${BBPS_PROXY}/transaction-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  try {
    return (await res.json()) as BbpsTransactionStatusResponse;
  } catch {
    return { success: false, error: { message: `Status unavailable (HTTP ${res.status}).` } };
  }
}

export async function registerBbpsComplaint(body: BbpsComplaintRegisterRequest): Promise<BbpsComplaintRegisterResponse> {
  const res = await fetch(`${BBPS_PROXY}/complaint/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  try {
    return (await res.json()) as BbpsComplaintRegisterResponse;
  } catch {
    return { success: false, error: { message: `Complaint registration failed (HTTP ${res.status}).` } };
  }
}

export async function trackBbpsComplaint(body: BbpsComplaintTrackRequest): Promise<BbpsComplaintTrackResponse> {
  const res = await fetch(`${BBPS_PROXY}/complaint/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  try {
    return (await res.json()) as BbpsComplaintTrackResponse;
  } catch {
    return { success: false, error: { message: `Complaint tracking failed (HTTP ${res.status}).` } };
  }
}
