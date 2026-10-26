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

/** Payout Partner API (IMPS/NEFT) — POSTMAN-COLLECTION-PAYOUT.json v3.0 (dedicated partner wallet, no merchant_id). */

/** Partner wallet balance response. */
export interface PayoutBalanceResponse {
  success: boolean;
  balance?: number;
  is_frozen?: boolean;
  freeze_reason?: string | null;
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

// PayoutVerifyRequest and PayoutVerifyResponse removed — no verify endpoint in v3.0.
// Beneficiary registration is handled automatically on the first transfer.

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

/** SHADVAL Settlement-2 API Types */

export interface ShadvalBalanceResponse {
  success: boolean;
  balance?: number;
  is_frozen?: boolean;
  freeze_reason?: string;
  error?: { code?: string; message?: string };
}

export interface ShadvalAccount {
  id: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_mobile?: string;
  is_verified: boolean;
  verification_status?: "VERIFIED" | "NOT_VERIFIED" | "SKIPPED" | "PENDING" | "FAILED";
  verification_label?: string;
  verified_name?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface ShadvalAddAccountRequest {
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_mobile?: string;
  skip_verification?: boolean;
}

export interface ShadvalAddAccountResponse {
  success: boolean;
  verified?: boolean;
  verification_status?: string;
  verification_label?: string;
  verified_name?: string;
  account?: ShadvalAccount;
  charge_deducted?: number;
  skip_verification?: boolean;
  message?: string;
  error?: { code?: string; message?: string };
}

export interface ShadvalAccountsResponse {
  success: boolean;
  accounts?: ShadvalAccount[];
  count?: number;
  error?: { code?: string; message?: string };
}

export interface ShadvalChargesResponse {
  success: boolean;
  amount?: number;
  mode?: string;
  scheme_name?: string;
  charges?: number;
  gst_amount?: number;
  total_charge?: number;
  total_debit?: number;
  error?: { code?: string; message?: string };
}

export interface ShadvalTransferRequest {
  account_id: string;
  amount: number;
  mode?: "IMPS" | "NEFT" | "RTGS";
  narration?: string;
  contact_name?: string;
  contact_email?: string;
  contact_mobile?: string;
  contact_details?: {
    name?: string;
    email?: string;
    mobile?: string;
  };
}

export interface ShadvalTransaction {
  id?: string;
  reference_id?: string;
  order_id?: string;
  utr?: string;
  amount?: number;
  charges?: number;
  total_debited?: number;
  mode?: string;
  status?: string;
  status_message?: string;
  account_number?: string;
  account_holder_name?: string;
  ifsc_code?: string;
  created_at?: string;
}

export interface ShadvalTransferResponse {
  success: boolean;
  transaction?: ShadvalTransaction;
  message?: string;
  error?: { code?: string; message?: string };
}

export interface ShadvalStatusResponse {
  success: boolean;
  transaction?: ShadvalTransaction;
  error?: { code?: string; message?: string };
}

export interface ShadvalListResponse {
  success: boolean;
  transactions?: ShadvalTransaction[];
  count?: number;
  error?: { code?: string; message?: string };
}

/** BBPS Bill Payment API Types */

export interface BbpsCategoriesResponse {
  success: boolean;
  categories?: string[];
  count?: number;
  error?: { code?: string; message?: string };
}

export interface BbpsBiller {
  biller_id: string;
  biller_name: string;
  biller_category?: string;
  [key: string]: unknown;
}

export interface BbpsBillersResponse {
  success: boolean;
  data?: BbpsBiller[];
  count?: number;
  error?: { code?: string; message?: string };
}

export interface BbpsInputParam {
  paramName: string;
  dataType?: string;
  isOptional?: boolean | string;
  minLength?: number;
  maxLength?: number;
  regex?: string;
  values?: string[];
  [key: string]: unknown;
}

export interface BbpsBillerInfo {
  billerId: string;
  billerName: string;
  billerCategory?: string;
  billerInputParams?: BbpsInputParam[];
  supportBillFetch?: boolean | string;
  amountExactness?: string;
  billerPaymentModes?: string[];
  [key: string]: unknown;
}

export interface BbpsBillerInfoResponse {
  success: boolean;
  biller_info?: BbpsBillerInfo;
  error?: { code?: string; message?: string };
}

export interface BbpsFetchBillRequest {
  biller_id: string;
  consumer_number?: string;
  input_params?: { paramName: string; paramValue: string }[];
  payment_mode?: string;
  init_channel?: string;
  ip?: string;
  mac?: string;
  enquiry_id?: string;
}

export interface BbpsBillerResponse {
  billAmount?: string;
  billDate?: string;
  customerName?: string;
  dueDate?: string;
  [key: string]: unknown;
}

export interface BbpsBill {
  bill_amount?: number | string;
  consumer_name?: string;
  bill_date?: string;
  due_date?: string;
  bill_number?: string;
  [key: string]: unknown;
}

export interface BbpsFetchBillResponse {
  success: boolean;
  data?: {
    responseCode?: string;
    billerResponse?: BbpsBillerResponse;
    inputParams?: { paramName: string; paramValue: string }[];
    additionalInfo?: unknown[];
    [key: string]: unknown;
  };
  reqId?: string;
  bill?: BbpsBill;
  error?: { code?: string; message?: string };
}

export interface BbpsPayBillRequest {
  retailer_id: string;
  biller_id: string;
  biller_name: string;
  consumer_number: string;
  amount: number;
  consumer_name?: string;
  due_date?: string;
  bill_date?: string;
  bill_number?: string;
  biller_category?: string;
  reqId?: string;
  payment_mode?: string;
  pan_number?: string;
  customer_name?: string;
  customer_email?: string;
  customer_mobile?: string;
  upi_id?: string;
  additional_info?: {
    category?: string;
    reqId?: string;
    inputParams?: { paramName: string; paramValue: string }[];
    billerResponse?: BbpsBillerResponse;
    additionalInfo?: unknown[];
  };
}

export interface BbpsPayBillResponse {
  success: boolean;
  transaction_id?: string;
  agent_transaction_id?: string;
  bbps_transaction_id?: string;
  status?: string;
  payment_status?: string;
  error_code?: string;
  error_message?: string;
  error?: { code?: string; message?: string };
  wallet_balance?: number;
  charge?: number;
  required_amount?: number;
}

export interface BbpsTransactionStatusRequest {
  transaction_id: string;
  track_type?: string;
}

export interface BbpsTransactionStatusResponse {
  success: boolean;
  status?: string;
  message?: string;
  data?: {
    reqId?: string;
    totalAmount?: number | string;
    serviceCharge?: number | string;
    transactionAmount?: number | string;
    referenceNo?: string;
    transaction_id?: string;
    status?: string;
    remark?: string;
    [key: string]: unknown;
  };
  error?: { code?: string; message?: string };
}

export interface BbpsComplaintRegisterRequest {
  transaction_id: string;
  complaint_type?: string;
  description: string;
  complaint_disposition?: string;
}

export interface BbpsComplaintRegisterResponse {
  success: boolean;
  data?: {
    complaintAssigned?: string;
    complaintId?: string;
    responseCode?: string;
    responseReason?: string;
  };
  error?: { code?: string; message?: string };
}

export interface BbpsComplaintTrackRequest {
  complaint_id: string;
  complaint_type?: string;
}

export interface BbpsComplaintTrackResponse {
  success: boolean;
  data?: {
    complaintId?: string;
    complaintType?: string;
    status?: string;
    description?: string;
    resolution?: string;
    [key: string]: unknown;
  };
  error?: { code?: string; message?: string };
}

/** BBPS-2 Pay2New Credit Card Bill Payment API Types */

export interface Pay2NewBiller {
  product_code: string;
  product_name: string;
  service_id?: string;
}

export interface Pay2NewBillersResponse {
  success: boolean;
  billers?: Pay2NewBiller[];
  count?: number;
  service_id?: string;
  error?: { code?: string; message?: string };
}

export interface Pay2NewChargesRequest {
  amount: number;
}

export interface Pay2NewCharges {
  base_charge: number;
  gst_percent: number;
  gst_amount: number;
  total_charge: number;
}

export interface Pay2NewChargesResponse {
  success: boolean;
  amount?: number;
  scheme_name?: string;
  charges?: Pay2NewCharges;
  error?: { code?: string; message?: string };
}

export interface Pay2NewFetchBillRequest {
  number: string;
  product_code: string;
  customer_number: string;
  optional1?: string;
  optional2?: string;
  optional3?: string;
  optional4?: string;
  pincode?: string;
}

export interface Pay2NewBillData {
  customer_name?: string;
  amount?: number;
  bill_date?: string;
  due_date?: string;
  bill_due_date?: string;
  bill_number?: string;
  "Minimum Amount Due"?: string;
  "Maximum Permissible Amount"?: string;
  [key: string]: unknown;
}

export interface Pay2NewFetchBillResponse {
  success: boolean;
  data?: Pay2NewBillData;
  order_id?: string;
  request_id?: string;
  error?: { code?: string; message?: string };
}

export interface Pay2NewPayBillRequest {
  number: string;
  amount: number;
  product_code: string;
  product_name?: string;
  bill_fetch_ref: string;
  customer_number: string;
  optional1?: string;
  optional2?: string;
  optional3?: string;
  optional4?: string;
  pincode?: string;
}

export interface Pay2NewPayBillResponse {
  success: boolean;
  order_id?: string;
  operator_reference?: string;
  amount?: number;
  charge?: number;
  request_id?: string;
  wallet_balance?: number;
  bill_amount?: number;
  required_amount?: number;
  refunded?: boolean;
  refund_amount?: number;
  error?: { code?: string; message?: string };
}

export interface Pay2NewBillStatusRequest {
  order_id?: string;
  request_id?: string;
}

export interface Pay2NewBillStatusResponse {
  success: boolean;
  order_id?: string | null;
  status?: "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";
  amount?: number;
  charge?: number;
  operator_reference?: string | null;
  created_at?: string;
  updated_at?: string;
  request_id?: string;
  error?: { code?: string; message?: string };
}

/** Credit Card-2 (RechargeKit) Direct CC Payment API Types */

export type RechargeKitStatus = "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";

export interface RechargeKitOperator {
  operator_id: string;
  operator_name: string;
  operator_code: string;
  /** Some upstream lists include the card IFSC directly; used to auto-fill when present. */
  ifsc?: string;
}

export interface RechargeKitOperatorsResponse {
  success: boolean;
  operators?: RechargeKitOperator[];
  count?: number;
  /** Present when served from the server-side cache. */
  cached?: boolean;
  cached_at?: string;
  error?: { code?: string; message?: string };
}

export interface RechargeKitChargesRequest {
  amount: number;
}

export interface RechargeKitCharges {
  base_charge: number;
  gst_percent: number;
  gst_amount: number;
  total_charge: number;
}

export interface RechargeKitChargesResponse {
  success: boolean;
  amount?: number;
  scheme_name?: string;
  charges?: RechargeKitCharges;
  error?: { code?: string; message?: string };
}

export interface RechargeKitPayRequest {
  mobile_no: string;
  account_no: string;
  ifsc: string;
  bank_name: string;
  beneficiary_name: string;
  amount: number;
  operator_code: string;
}

export interface RechargeKitPayResponse {
  success: boolean;
  status?: RechargeKitStatus;
  txn_id?: string | null;
  operator_reference?: string | null;
  amount?: number;
  charge?: number;
  request_id?: string;
  message?: string;
  wallet_balance?: number;
  bill_amount?: number;
  required_amount?: number;
  refunded?: boolean;
  refund_amount?: number;
  error?: { code?: string; message?: string };
}

export interface RechargeKitStatusRequest {
  txn_id?: string;
  request_id?: string;
}

export interface RechargeKitStatusResponse {
  success: boolean;
  txn_id?: string | null;
  status?: RechargeKitStatus;
  amount?: number;
  charge?: number;
  operator_reference?: string | null;
  created_at?: string;
  updated_at?: string;
  request_id?: string;
  error?: { code?: string; message?: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Same Day Solution — Payout API v3.0 (Simplified Direct Transfer)
// Spec: "Integrate the Same Day Solution Payout API" (2026)
// Endpoint base: /api/partner/payout/*
// ─────────────────────────────────────────────────────────────────────────────

/** Request body for POST /api/partner/payout/transfer (v3.0 simplified). */
export interface SdsPayoutTransferRequest {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  /** 10-digit Indian mobile number */
  mobile: string;
  /** Amount in ₹ — minimum ₹100, maximum ₹2,00,000 */
  amount: number;
  email?: string;
  /** Defaults to "IMPS" */
  paymentMode?: "IMPS" | "NEFT";
  remarks?: string;
}

/** Successful transfer response (HTTP 200). */
export interface SdsPayoutTransferResponse {
  success: boolean;
  message?: string;
  /** UUID — save this for status polling.  Present on both success and failure. */
  transaction_id?: string;
  /** Partner-side transaction reference */
  partner_trans_id?: string;
  /** Bank UTR — null when status is PENDING */
  utr?: string | null;
  /** SUCCESS | PENDING | FAILED */
  status?: "SUCCESS" | "PENDING" | "FAILED";
  amount?: number;
  charges?: number;
  /** Beneficiary verification charge (₹4 + 18% GST = ₹4.72 for new accounts; 0 for repeat). */
  verification_charge?: number;
  /** true on the first-ever transfer to this account number. */
  is_new_beneficiary?: boolean;
  total_debited?: number;
  payment_mode?: string;
  account_number?: string;
  account_holder_name?: string;
  bank_name?: string;
  error?: { code?: string; message?: string };
}

/** Individual transaction record (used in status and list responses). */
export interface SdsPayoutTransaction {
  transaction_id: string;
  partner_trans_id?: string | null;
  /** Bank UTR — null when PENDING or FAILED */
  utr?: string | null;
  /** SUCCESS | PENDING | FAILED */
  status: "SUCCESS" | "PENDING" | "FAILED";
  amount?: number;
  charges?: number;
  /** Beneficiary verification charge (₹4 + 18% GST = ₹4.72 for new accounts; 0 for repeat). */
  verification_charge?: number;
  /** true on the first-ever transfer to this account number. */
  is_new_beneficiary?: boolean;
  total_debited?: number;
  payment_mode?: string;
  account_number?: string;
  account_holder_name?: string;
  bank_name?: string;
  ifsc_code?: string;
  created_at?: string;
  /** null when PENDING */
  completed_at?: string | null;
}

/** GET /api/partner/payout/status?transactionId=… or ?partnerTransId=… */
export interface SdsPayoutStatusResponse {
  success: boolean;
  transaction?: SdsPayoutTransaction;
  error?: { code?: string; message?: string };
}

/** GET /api/partner/payout/status?list=true&limit=N */
export interface SdsPayoutListResponse {
  success: boolean;
  transactions?: SdsPayoutTransaction[];
  count?: number;
  error?: { code?: string; message?: string };
}

/**
 * Internal DB record stored in payout_transactions table.
 * Mirrors SdsPayoutTransaction with the addition of idempotency_key and
 * the UNKNOWN status used when a network timeout prevents us learning the
 * real status.
 */
export interface PayoutDbRecord {
  transaction_id: string;
  partner_trans_id: string | null;
  utr: string | null;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  bank_name: string;
  mobile: string;
  amount: number;
  payment_mode: string;
  /** SUCCESS | PENDING | FAILED | UNKNOWN */
  status: string;
  /** ₹4.72 for new beneficiaries; 0 for repeat. Stored as REAL. */
  verification_charge: number;
  /** 1 = first-ever transfer to this account; 0 = repeat. Stored as INTEGER (SQLite bool). */
  is_new_beneficiary: number;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}
