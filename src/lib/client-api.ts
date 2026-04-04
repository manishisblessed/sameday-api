import type {
  TransactionResponse,
  TransactionFilters,
  MachineResponse,
  HealthResponse,
  ExportJobResponse,
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
