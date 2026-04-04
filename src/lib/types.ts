export interface Transaction {
  id: string;
  razorpay_txn_id: string;
  external_ref: string;
  terminal_id: string;
  amount: string;
  status: string;
  rrn: string;
  card_brand: string;
  card_type: string;
  card_number: string;
  issuing_bank: string;
  card_classification: string | null;
  card_txn_type: string | null;
  acquiring_bank: string;
  payment_mode: string;
  device_serial: string;
  customer_name: string;
  payer_name: string;
  txn_type: string;
  auth_code: string;
  mid: string;
  currency: string;
  receipt_url: string;
  posting_date: string;
  txn_time: string;
  created_at: string;
}

export interface TransactionResponse {
  success: boolean;
  company?: string;
  data: Transaction[];
  pagination: {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  summary: {
    total_transactions: number;
    total_amount: string;
    authorized_count: number;
    captured_count: number;
    failed_count: number;
    refunded_count: number;
    captured_amount: string;
    terminal_count: number;
  };
}

export interface Machine {
  id: string;
  terminal_id: string;
  device_serial: string;
  machine_model: string;
  status: string;
  activated_at: string;
  last_txn_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  retailer_code: string;
  retailer_name: string;
  retailer_business_name: string;
  retailer_city: string;
  retailer_state: string;
}

export interface MachineResponse {
  success: boolean;
  company?: string;
  data: Machine[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

export interface ExportJob {
  message?: string;
  job_id: string;
  format: string;
  status: string;
  remaining_exports_today?: number;
  file_url?: string | null;
  file_size_bytes?: number;
  record_count?: number;
  created_at?: string;
  completed_at?: string | null;
  expires_at?: string;
}

export interface ExportJobResponse {
  success: boolean;
  data: ExportJob | { job: ExportJob };
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  database: {
    status: string;
    latency_ms: number | null;
  };
}

export interface TransactionFilters {
  date_from: string;
  date_to: string;
  status?: string | null;
  terminal_id?: string | null;
  payment_mode?: string | null;
  page: number;
  page_size: number;
}
