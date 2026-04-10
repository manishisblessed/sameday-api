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

/** Payout Partner API (IMPS/NEFT) — POSTMAN-COLLECTION-PAYOUT.json v2.1+ (`merchant_id`; legacy `retailer_id` alias on upstream). */

/** Merchant linked to the partner account for payout (from List My Merchants). */
export interface PayoutMerchant {
  merchant_id: string;
  name?: string;
  business_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  onboarded?: boolean;
}

export interface PayoutMerchantsResponse {
  success: boolean;
  merchants?: PayoutMerchant[];
  total?: number;
  message?: string;
  error?: { code?: string; message?: string };
}

export interface PayoutBank {
  id: number;
  /** Display name; upstream may send `bank_name` / `bankName` — normalized in `fetchPayoutBanks`. */
  name: string;
  imps: boolean;
  neft: boolean;
}

export interface PayoutBanksResponse {
  success: boolean;
  banks?: PayoutBank[];
  total?: number;
  imps_enabled?: number;
  neft_enabled?: number;
  error?: { code?: string; message?: string };
}

export interface PayoutVerifyRequest {
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
  bankId?: number;
}

export interface PayoutVerifyResponse {
  success: boolean;
  is_valid?: boolean;
  account_holder_name?: string;
  bank_name?: string;
  branch_name?: string;
  verification_charges?: number;
  message?: string;
  reference_id?: string;
  error?: { code?: string; message?: string };
}

export interface PayoutTransferRequest {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  amount: number;
  transferMode: "IMPS" | "NEFT";
  bankId: number;
  bankName: string;
  beneficiaryMobile: string;
  senderName: string;
  senderMobile: string;
  senderEmail?: string;
  remarks?: string;
}

export interface PayoutTransferResponse {
  success: boolean;
  message?: string;
  transaction_id?: string;
  provider_txn_id?: string;
  client_ref_id?: string;
  status?: string;
  amount?: number;
  charges?: number;
  total_debited?: number;
  account_number?: string;
  account_holder_name?: string;
  bank_name?: string;
  transfer_mode?: string;
  error?: { code?: string; message?: string };
  wallet_balance?: number;
  wait_seconds?: number;
  duplicate_prevention?: boolean;
}

export interface PayoutTransactionDetail {
  id: string;
  client_ref_id?: string;
  provider_txn_id?: string;
  rrn?: string;
  status?: string;
  amount?: number;
  charges?: number;
  total_amount?: number;
  account_number?: string;
  account_holder_name?: string;
  bank_name?: string;
  transfer_mode?: string;
  created_at?: string;
  completed_at?: string | null;
  merchant_id?: string;
  /** Legacy alias; same value as merchant_id when present */
  retailer_id?: string;
}

export interface PayoutStatusResponse {
  success: boolean;
  transaction?: PayoutTransactionDetail;
  error?: { code?: string; message?: string };
}

export interface PayoutListItem {
  id: string;
  merchant_id?: string;
  /** Legacy alias from API */
  retailer_id?: string;
  client_ref_id?: string;
  amount?: number;
  charges?: number;
  status?: string;
  transfer_mode?: string;
  created_at?: string;
}

export interface PayoutListResponse {
  success: boolean;
  transactions?: PayoutListItem[];
  error?: { code?: string; message?: string };
}
