"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  IndianRupee,
  CheckCircle2,
  XCircle,
  MoveLeft,
  Search,
  CreditCard,
  Loader2,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Lock,
  KeyRound,
  ShieldCheck,
  BadgeCheck,
  Wallet,
  RefreshCw,
  Landmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchRechargeKitOperators,
  fetchRechargeKitCharges,
  payRechargeKit,
  checkRechargeKitStatus,
} from "@/lib/client-api";
import { isValidCardNumber, isValidMobile } from "@/lib/rechargekit-validation";
import { lookupCcIfsc } from "@/lib/rechargekit-ifsc";
import type {
  RechargeKitOperator,
  RechargeKitChargesResponse,
  RechargeKitPayResponse,
  RechargeKitStatusResponse,
} from "@/lib/types";

type Step = "operators" | "payment-form" | "charges" | "payment-result" | "check-status";

const RECHARGEKIT_TOKEN_KEY = "rechargekit_unlock_token";
const MAX_POLLS = 10;
const POLL_INTERVAL_MS = 30_000;

// ─── Password gate (reuses the shared "bbps" credit-card gate) ────────────────

function RechargeKitPasswordGate({ onUnlock, onBack }: { onUnlock: () => void; onBack: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingDisabled, setCheckingDisabled] = useState(true);

  useEffect(() => {
    fetch("/api/bbps/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.passwordDisabled && d.token !== undefined) {
          sessionStorage.setItem(RECHARGEKIT_TOKEN_KEY, d.token);
          onUnlock();
        } else {
          setCheckingDisabled(false);
        }
      })
      .catch(() => setCheckingDisabled(false));
  }, [onUnlock]);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/bbps/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        sessionStorage.setItem(RECHARGEKIT_TOKEN_KEY, data.token);
        onUnlock();
      } else {
        setError(data.error?.message ?? "Incorrect password.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingDisabled) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-slate-50 via-emerald-50/30 to-teal-50/20 md:min-h-[calc(100vh-3.5rem)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(16,185,129,0.12),transparent)]" aria-hidden />
      <div className="relative flex min-h-[inherit] flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-300">
          <div className="mb-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600/90">Protected</p>
            <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
              Credit Card-2 (RechargeKit)
            </h2>
            <p className="mx-auto mt-2 max-w-[340px] text-sm leading-relaxed text-slate-600">
              This area handles direct credit card payments via RechargeKit. Enter the access password to continue.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15)] ring-1 ring-white/60 backdrop-blur-md">
            <div className="rounded-[0.9rem] bg-gradient-to-b from-white to-slate-50/80 px-6 pb-6 pt-7 sm:px-8">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-emerald-400/25 to-teal-400/20 blur-xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-white">
                    <ShieldCheck className="h-8 w-8 opacity-95" strokeWidth={1.5} />
                    <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-white bg-slate-900 text-white shadow-md">
                      <Lock className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="rk-pw" className="text-sm font-medium text-slate-800">Access password</label>
                  <Input
                    id="rk-pw"
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !loading && pw.trim() && submit()}
                    placeholder="••••••••"
                    className="h-11 rounded-xl border-slate-200 bg-white text-base shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/25 md:text-sm"
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-sm text-red-800">
                    {error}
                  </div>
                )}

                <Button
                  type="button"
                  size="lg"
                  className="h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-[15px] font-semibold text-white shadow-md shadow-emerald-500/25 transition hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-60"
                  onClick={submit}
                  disabled={loading || !pw.trim()}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                  Unlock dashboard
                </Button>

                <button
                  type="button"
                  onClick={onBack}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
                >
                  <MoveLeft className="h-4 w-4 shrink-0" />
                  Back to API modules
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  onBack: () => void;
}

export function RechargeKitCreditCardDashboard({ onBack }: Props) {
  const [authState, setAuthState] = useState<"checking" | "locked" | "unlocked">("checking");

  useEffect(() => {
    const token = sessionStorage.getItem(RECHARGEKIT_TOKEN_KEY);
    fetch("/api/bbps/check-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token || "" }),
    })
      .then((r) => r.json())
      .then((d) => {
        setAuthState(d.passwordDisabled || d.valid ? "unlocked" : "locked");
      })
      .catch(() => setAuthState("locked"));
  }, []);

  if (authState === "checking") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (authState === "locked") {
    return <RechargeKitPasswordGate onUnlock={() => setAuthState("unlocked")} onBack={onBack} />;
  }

  return <RechargeKitDashboardContent onBack={onBack} />;
}

const STATUS_STYLES: Record<string, { border: string; text: string }> = {
  SUCCESS: { border: "border-green-200 bg-green-50", text: "text-green-800" },
  PENDING: { border: "border-amber-200 bg-amber-50", text: "text-amber-800" },
  FAILED: { border: "border-red-200 bg-red-50", text: "text-red-800" },
  REFUNDED: { border: "border-blue-200 bg-blue-50", text: "text-blue-800" },
};

const ERROR_HINTS: Record<string, string> = {
  INSUFFICIENT_BALANCE: "Partner wallet balance is too low. Recharge your wallet and try again.",
  WALLET_FROZEN: "Partner wallet is frozen. Contact Same Day Solution admin.",
  PAYMENT_FAILED: "Payment failed at the provider. Wallet has been auto-refunded — safe to retry.",
  PROVIDER_ERROR: "Provider network error. Wallet has been auto-refunded — safe to retry.",
  SERVICE_NOT_ENABLED: "Credit Card-2 (RechargeKit) is not enabled for this partner. Contact admin.",
  IP_NOT_WHITELISTED: "Your server IP is not whitelisted. Contact admin to whitelist it.",
  UNAUTHORIZED: "Invalid API key, expired timestamp, or bad signature.",
  GATE_LOCKED: "Access locked. Unlock the dashboard with your password.",
  ORDER_NOT_FOUND: "No transaction found for the given txn_id / request_id.",
};

function RechargeKitDashboardContent({ onBack }: Props) {
  const [step, setStep] = useState<Step>("operators");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Operators
  const [operators, setOperators] = useState<RechargeKitOperator[]>([]);
  const [operatorsCached, setOperatorsCached] = useState(false);
  const [operatorSearch, setOperatorSearch] = useState("");
  const [selectedOperator, setSelectedOperator] = useState<RechargeKitOperator | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Payment form
  const [mobileNo, setMobileNo] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [ifscAutoFilled, setIfscAutoFilled] = useState(false);
  const [bankName, setBankName] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [amount, setAmount] = useState("");

  // Charges
  const [chargesData, setChargesData] = useState<RechargeKitChargesResponse | null>(null);

  // Payment result
  const [paymentResult, setPaymentResult] = useState<RechargeKitPayResponse | null>(null);
  const [ambiguous, setAmbiguous] = useState(false);

  // Status check + polling
  const [statusResult, setStatusResult] = useState<RechargeKitStatusResponse | null>(null);
  const [statusTxnId, setStatusTxnId] = useState("");
  const [statusRequestId, setStatusRequestId] = useState("");
  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttempt = useRef(0);

  // Stats
  const [stats, setStats] = useState({ totalRequests: 0, totalAmount: 0, success: 0, failed: 0 });
  const countedTxns = useRef<Set<string>>(new Set());

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
    setPolling(false);
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const amountNum = Number(amount);
  const mobileValid = isValidMobile(mobileNo);
  const cardValid = isValidCardNumber(accountNo);
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;
  const formValid =
    mobileValid && cardValid && amountValid && ifsc.trim() !== "" && bankName.trim() !== "" && beneficiaryName.trim() !== "";

  const loadOperators = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetchRechargeKitOperators({ refresh });
      if (res.success && res.operators) {
        setOperators(res.operators);
        setOperatorsCached(Boolean(res.cached));
      } else {
        const code = res.error?.code;
        setError(res.error?.message || ERROR_HINTS[code ?? ""] || "Failed to load operators");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load operators");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOperators(false);
  }, [loadOperators]);

  const handleSelectOperator = (op: RechargeKitOperator) => {
    setSelectedOperator(op);
    setBankName(op.operator_name.replace(/\s*credit card\s*/i, "").trim() || op.operator_name);
    // Auto-fetch the CC IFSC: prefer an API-provided value, else resolve by bank name.
    const resolvedIfsc = (op.ifsc || lookupCcIfsc(op.operator_name)).toUpperCase();
    setIfsc(resolvedIfsc);
    setIfscAutoFilled(Boolean(resolvedIfsc));
    setStep("payment-form");
    setError(null);
  };

  const handleCheckCharges = async () => {
    if (!amountValid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRechargeKitCharges({ amount: amountNum });
      if (res.success) {
        setChargesData(res);
        setStep("charges");
      } else {
        setError(res.error?.message || ERROR_HINTS[res.error?.code ?? ""] || "Failed to check charges");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to check charges");
    } finally {
      setLoading(false);
    }
  };

  const markTerminal = useCallback((res: RechargeKitStatusResponse) => {
    const key = res.txn_id || res.request_id;
    if (!key || countedTxns.current.has(key)) return;
    if (res.status === "SUCCESS") {
      countedTxns.current.add(key);
      setStats((s) => ({ ...s, success: s.success + 1, totalAmount: s.totalAmount + (res.amount || 0) }));
    } else if (res.status === "FAILED" || res.status === "REFUNDED") {
      countedTxns.current.add(key);
      setStats((s) => ({ ...s, failed: s.failed + 1 }));
    }
  }, []);

  const runStatusCheck = useCallback(
    async (txnId?: string, requestId?: string): Promise<RechargeKitStatusResponse> => {
      const body: { txn_id?: string; request_id?: string } = {};
      if (txnId) body.txn_id = txnId;
      if (requestId) body.request_id = requestId;
      const res = await checkRechargeKitStatus(body);
      setStatusResult(res);
      if (res.success) markTerminal(res);
      return res;
    },
    [markTerminal]
  );

  const startPolling = useCallback(
    (txnId?: string, requestId?: string) => {
      stopPolling();
      pollAttempt.current = 0;
      setPollCount(0);
      setPolling(true);
      const tick = async () => {
        pollAttempt.current += 1;
        setPollCount(pollAttempt.current);
        let res: RechargeKitStatusResponse;
        try {
          res = await runStatusCheck(txnId, requestId);
        } catch {
          pollTimer.current = setTimeout(tick, POLL_INTERVAL_MS);
          return;
        }
        const terminal =
          !res.success ||
          res.status === "SUCCESS" ||
          res.status === "FAILED" ||
          res.status === "REFUNDED";
        if (terminal || pollAttempt.current >= MAX_POLLS) {
          stopPolling();
          return;
        }
        pollTimer.current = setTimeout(tick, POLL_INTERVAL_MS);
      };
      // We already have a PENDING from Pay, so wait one interval before the first poll.
      pollTimer.current = setTimeout(tick, POLL_INTERVAL_MS);
    },
    [runStatusCheck, stopPolling]
  );

  const openStatusCheck = (txnId?: string, requestId?: string, autoPoll = false) => {
    stopPolling();
    setStatusResult(null);
    setStatusTxnId(txnId || "");
    setStatusRequestId(requestId || "");
    setStep("check-status");
    setError(null);
    if (txnId || requestId) {
      runStatusCheck(txnId, requestId).then((res) => {
        if (autoPoll && res.success && res.status === "PENDING") {
          startPolling(txnId, requestId);
        }
      });
    }
  };

  const handlePayBill = async () => {
    if (!selectedOperator || !formValid) return;
    setLoading(true);
    setError(null);
    setAmbiguous(false);
    setStats((s) => ({ ...s, totalRequests: s.totalRequests + 1 }));
    try {
      const res = await payRechargeKit({
        mobile_no: mobileNo.trim(),
        account_no: accountNo.replace(/[\s-]/g, ""),
        ifsc: ifsc.trim().toUpperCase(),
        bank_name: bankName.trim(),
        beneficiary_name: beneficiaryName.trim(),
        amount: amountNum,
        operator_code: selectedOperator.operator_code,
      });
      setPaymentResult(res);
      setStep("payment-result");

      if (res.success && res.status === "SUCCESS") {
        const key = res.txn_id || res.request_id;
        if (key && !countedTxns.current.has(key)) {
          countedTxns.current.add(key);
          setStats((s) => ({ ...s, success: s.success + 1, totalAmount: s.totalAmount + (res.amount || amountNum) }));
        }
      } else if (res.success && res.status === "PENDING") {
        // Start polling status; do NOT retry Pay.
        openStatusCheck(res.txn_id || undefined, res.request_id, true);
      } else {
        setStats((s) => ({ ...s, failed: s.failed + 1 }));
      }
    } catch {
      // Network/timeout on Pay — status is UNKNOWN. Never retry Pay; recover via status.
      setAmbiguous(true);
      setPaymentResult(null);
      setStep("payment-result");
      setStats((s) => ({ ...s, failed: s.failed + 1 }));
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    stopPolling();
    setStep("operators");
    setSelectedOperator(null);
    setMobileNo("");
    setAccountNo("");
    setIfsc("");
    setIfscAutoFilled(false);
    setBankName("");
    setBeneficiaryName("");
    setAmount("");
    setChargesData(null);
    setPaymentResult(null);
    setAmbiguous(false);
    setStatusResult(null);
    setStatusTxnId("");
    setStatusRequestId("");
    setError(null);
  };

  const goBack = () => {
    setError(null);
    stopPolling();
    switch (step) {
      case "payment-form":
        setStep("operators");
        setSelectedOperator(null);
        break;
      case "charges":
        setStep("payment-form");
        setChargesData(null);
        break;
      case "payment-result":
        setStep("charges");
        setPaymentResult(null);
        setAmbiguous(false);
        break;
      case "check-status":
        if (paymentResult || ambiguous) setStep("payment-result");
        else setStep("operators");
        setStatusResult(null);
        break;
    }
  };

  const filteredOperators = operators.filter(
    (o) =>
      o.operator_name.toLowerCase().includes(operatorSearch.toLowerCase()) ||
      o.operator_code.toLowerCase().includes(operatorSearch.toLowerCase())
  );

  const totalPayable =
    (chargesData?.amount ?? amountNum) + (chargesData?.charges?.total_charge ?? 0);

  const stepLabels = ["Operators", "Card Details", "Charges", "Pay", "Status"];
  const stepNames: Step[] = ["operators", "payment-form", "charges", "payment-result", "check-status"];
  const currentIdx = stepNames.indexOf(step);

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Credit Card-2 (RechargeKit)</h1>
          <p className="text-sm text-muted-foreground">
            Direct credit card payments via RechargeKit ({operators.length} operators
            {operatorsCached ? " · cached" : ""})
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {step !== "operators" && (
            <Button variant="outline" size="sm" onClick={goBack}>
              <MoveLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {step !== "operators" && (
            <Button variant="outline" size="sm" onClick={resetFlow}>
              New Payment
            </Button>
          )}
          {step !== "check-status" && (
            <Button variant="outline" size="sm" onClick={() => openStatusCheck()}>
              <Search className="h-4 w-4" />
              Check Status
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onBack}>
            <MoveLeft className="h-4 w-4" />
            Change API
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={stats.totalRequests} icon={ArrowLeftRight} accent="blue" />
        <StatCard label="Total Amount" value={`₹${stats.totalAmount.toLocaleString("en-IN")}`} icon={IndianRupee} accent="green" />
        <StatCard label="Success" value={stats.success} icon={CheckCircle2} accent="green" />
        <StatCard label="Failed" value={stats.failed} icon={XCircle} accent="red" />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Step Progress */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto pb-1">
        {stepLabels.map((s, i) => {
          const isActive = i <= currentIdx;
          return (
            <span key={s} className="flex items-center gap-1 whitespace-nowrap">
              <span className={`px-2 py-0.5 rounded-full ${isActive ? "bg-green-100 text-green-800 font-medium" : "bg-muted"}`}>
                {s}
              </span>
              {i < stepLabels.length - 1 && <ChevronRight className="h-3 w-3" />}
            </span>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-3 text-sm text-muted-foreground">Processing...</span>
        </div>
      )}

      {/* Step: Operators */}
      {!loading && step === "operators" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Select Card Issuing Bank
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bank or operator code..."
                  className="pl-9"
                  value={operatorSearch}
                  onChange={(e) => setOperatorSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => loadOperators(true)} disabled={refreshing}>
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[480px] overflow-y-auto">
              {filteredOperators.map((op) => (
                <button
                  key={op.operator_code}
                  onClick={() => handleSelectOperator(op)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium">{op.operator_name}</p>
                    <p className="text-xs text-muted-foreground">Code: {op.operator_code}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
            {filteredOperators.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                {operators.length === 0 ? "No operators loaded. Check API connectivity or refresh." : "No matching operators found."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Payment Form */}
      {!loading && step === "payment-form" && selectedOperator && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {selectedOperator.operator_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Credit Card Number <span className="text-red-500">*</span>
                </label>
                <Input
                  inputMode="numeric"
                  placeholder="Full 16-digit card number"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value.replace(/[^\d]/g, "").slice(0, 19))}
                />
                <p className={`text-[11px] ${accountNo && !cardValid ? "text-red-600" : "text-muted-foreground"}`}>
                  {accountNo && !cardValid ? "Enter a valid card number (fails Luhn check)." : "Full credit card number (not last 4 digits)."}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Registered Mobile <span className="text-red-500">*</span>
                </label>
                <Input
                  inputMode="numeric"
                  placeholder="10-digit registered mobile"
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                />
                <p className={`text-[11px] ${mobileNo && !mobileValid ? "text-red-600" : "text-muted-foreground"}`}>
                  {mobileNo && !mobileValid ? "Mobile must be exactly 10 digits." : "Mobile number linked with the card."}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Beneficiary Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Card holder name"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. ICICI Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  CC IFSC Code <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. ICIC0000001"
                  value={ifsc}
                  onChange={(e) => {
                    setIfsc(e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 11));
                    setIfscAutoFilled(false);
                  }}
                />
                <p className={`text-[11px] ${ifscAutoFilled ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {ifscAutoFilled
                    ? "Auto-filled for this bank — verify and edit if your card uses a different IFSC."
                    : "Credit card IFSC of the issuing bank."}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="Amount in rupees"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={1}
                />
                <p className={`text-[11px] ${amount && !amountValid ? "text-red-600" : "text-muted-foreground"}`}>
                  {amount && !amountValid ? "Enter a valid amount greater than 0." : "Payment amount in rupees."}
                </p>
              </div>
            </div>

            <Button
              onClick={handleCheckCharges}
              disabled={!formValid}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              <Wallet className="h-4 w-4" />
              Check Charges &amp; Proceed
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Charges Confirmation */}
      {!loading && step === "charges" && chargesData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Amount</span>
                <span className="font-medium">₹{Number(chargesData.amount ?? amountNum).toLocaleString("en-IN")}</span>
              </div>
              {chargesData.scheme_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Scheme</span>
                  <span className="font-medium">{chargesData.scheme_name}</span>
                </div>
              )}
              {chargesData.charges && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Charge</span>
                    <span>₹{chargesData.charges.base_charge.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST ({chargesData.charges.gst_percent}%)</span>
                    <span>₹{chargesData.charges.gst_amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Charges</span>
                    <span className="font-medium">₹{chargesData.charges.total_charge.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Total Payable (Wallet Debit)</span>
                    <span className="text-lg font-bold text-green-800">₹{totalPayable.toLocaleString("en-IN")}</span>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm space-y-1">
              <p><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{bankName}</span> ({selectedOperator?.operator_name})</p>
              <p><span className="text-muted-foreground">Beneficiary:</span> <span className="font-medium">{beneficiaryName}</span></p>
              <p><span className="text-muted-foreground">Card:</span> <span className="font-medium">•••• {accountNo.slice(-4)}</span></p>
              <p><span className="text-muted-foreground">Mobile:</span> <span className="font-medium">{mobileNo}</span> · <span className="text-muted-foreground">IFSC:</span> <span className="font-medium">{ifsc}</span></p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <strong>Confirm:</strong> Clicking &quot;Pay Now&quot; will debit ₹{totalPayable.toLocaleString("en-IN")} from your partner wallet.
            </div>

            <div className="flex gap-3">
              <Button onClick={handlePayBill} className="bg-green-700 hover:bg-green-800 text-white">
                <CreditCard className="h-4 w-4" />
                Pay Now
              </Button>
              <Button variant="outline" onClick={goBack}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Payment Result */}
      {!loading && step === "payment-result" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {ambiguous ? (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              ) : paymentResult?.success && paymentResult.status === "SUCCESS" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : paymentResult?.success && paymentResult.status === "PENDING" ? (
                <Loader2 className="h-5 w-5 text-amber-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {ambiguous
                ? "Payment Status Unknown"
                : paymentResult?.success && paymentResult.status === "SUCCESS"
                ? "Payment Successful"
                : paymentResult?.success && paymentResult.status === "PENDING"
                ? "Payment Pending"
                : "Payment Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ambiguous ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 space-y-2 text-sm text-amber-900">
                <p className="font-medium">The Pay request timed out or hit a network error.</p>
                <p>
                  <strong>Do NOT retry the payment</strong> — it may cause a duplicate debit. Use <strong>Check Status</strong> with
                  the <code>request_id</code> from your logs to confirm the real outcome before doing anything else.
                </p>
              </div>
            ) : paymentResult ? (
              <div
                className={`rounded-lg border p-5 space-y-3 ${
                  paymentResult.success && paymentResult.status === "SUCCESS"
                    ? "border-green-200 bg-green-50"
                    : paymentResult.success && paymentResult.status === "PENDING"
                    ? "border-amber-200 bg-amber-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                {paymentResult.success ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      {paymentResult.status === "SUCCESS" ? (
                        <BadgeCheck className="h-6 w-6 text-green-600" />
                      ) : (
                        <Loader2 className="h-6 w-6 text-amber-600" />
                      )}
                      <span className={`text-lg font-semibold ${paymentResult.status === "SUCCESS" ? "text-green-800" : "text-amber-800"}`}>
                        {paymentResult.message || paymentResult.status}
                      </span>
                    </div>
                    {paymentResult.txn_id && (
                      <p className="text-sm"><span className="font-medium">Txn ID:</span> {paymentResult.txn_id}</p>
                    )}
                    {paymentResult.operator_reference && (
                      <p className="text-sm"><span className="font-medium">Operator Reference:</span> {paymentResult.operator_reference}</p>
                    )}
                    {paymentResult.amount != null && (
                      <p className="text-sm"><span className="font-medium">Amount:</span> ₹{Number(paymentResult.amount).toLocaleString("en-IN")}</p>
                    )}
                    {paymentResult.charge != null && (
                      <p className="text-sm"><span className="font-medium">Service Charge:</span> ₹{Number(paymentResult.charge).toLocaleString("en-IN")}</p>
                    )}
                    {paymentResult.request_id && (
                      <p className="text-xs text-muted-foreground">Request ID: {paymentResult.request_id}</p>
                    )}
                    {paymentResult.status === "PENDING" && (
                      <div className="mt-2 rounded-lg border border-amber-300 bg-amber-100 p-3 text-sm text-amber-900">
                        Payment is processing. We&apos;re polling status automatically every 30s{polling ? ` (attempt ${pollCount}/${MAX_POLLS})` : ""}. <strong>Do NOT retry.</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-red-800">
                      {paymentResult.error?.code ? `[${paymentResult.error.code}] ` : ""}
                      {paymentResult.error?.message || "Payment failed"}
                    </p>
                    {paymentResult.error?.code && ERROR_HINTS[paymentResult.error.code] && (
                      <p className="text-sm text-red-700">{ERROR_HINTS[paymentResult.error.code]}</p>
                    )}
                    {paymentResult.wallet_balance != null && (
                      <p className="text-sm text-red-700">Wallet Balance: ₹{paymentResult.wallet_balance.toLocaleString("en-IN")}</p>
                    )}
                    {paymentResult.required_amount != null && (
                      <p className="text-sm text-red-700">Required Amount: ₹{paymentResult.required_amount.toLocaleString("en-IN")}</p>
                    )}
                    {paymentResult.refunded && (
                      <p className="text-sm text-red-700">Wallet auto-refunded ₹{Number(paymentResult.refund_amount ?? 0).toLocaleString("en-IN")}. Safe to retry.</p>
                    )}
                    {paymentResult.request_id && (
                      <p className="text-xs text-muted-foreground">Request ID: {paymentResult.request_id}</p>
                    )}
                  </>
                )}
              </div>
            ) : null}

            <div className="flex gap-3 flex-wrap">
              {(paymentResult?.request_id || paymentResult?.txn_id) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openStatusCheck(paymentResult?.txn_id || undefined, paymentResult?.request_id, paymentResult?.status === "PENDING")}
                >
                  <Search className="h-4 w-4" />
                  Check Status
                </Button>
              )}
              {ambiguous && (
                <Button variant="outline" size="sm" onClick={() => openStatusCheck()}>
                  <Search className="h-4 w-4" />
                  Check Status
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={resetFlow}>
                <CreditCard className="h-4 w-4" />
                New Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Check Status */}
      {!loading && step === "check-status" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-5 w-5" />
              Transaction Status
              {polling && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-amber-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> polling {pollCount}/{MAX_POLLS}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Txn ID</label>
                <Input
                  placeholder="e.g. RKIT_TXN_9876543210"
                  value={statusTxnId}
                  onChange={(e) => setStatusTxnId(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Request ID</label>
                <Input
                  placeholder="e.g. RKCC1721554200000"
                  value={statusRequestId}
                  onChange={(e) => setStatusRequestId(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Provide either Txn ID or Request ID (at least one required).
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => runStatusCheck(statusTxnId.trim() || undefined, statusRequestId.trim() || undefined)}
                disabled={!statusTxnId.trim() && !statusRequestId.trim()}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                <Search className="h-4 w-4" />
                Check Status
              </Button>
              {polling && (
                <Button variant="outline" onClick={stopPolling}>
                  Stop auto-poll
                </Button>
              )}
            </div>

            {statusResult && (
              <div
                className={`rounded-lg border p-5 space-y-3 ${
                  STATUS_STYLES[statusResult.status ?? ""]?.border ?? "border-red-200 bg-red-50"
                }`}
              >
                {statusResult.success ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      {statusResult.status === "SUCCESS" && <BadgeCheck className="h-6 w-6 text-green-600" />}
                      {statusResult.status === "PENDING" && <Loader2 className="h-6 w-6 text-amber-600" />}
                      {statusResult.status === "FAILED" && <XCircle className="h-6 w-6 text-red-600" />}
                      {statusResult.status === "REFUNDED" && <ArrowLeftRight className="h-6 w-6 text-blue-600" />}
                      <span className={`text-lg font-semibold ${STATUS_STYLES[statusResult.status ?? ""]?.text ?? "text-red-800"}`}>
                        {statusResult.status}
                      </span>
                    </div>
                    {statusResult.txn_id && (
                      <p className="text-sm"><span className="font-medium">Txn ID:</span> {statusResult.txn_id}</p>
                    )}
                    {statusResult.operator_reference && (
                      <p className="text-sm"><span className="font-medium">Operator Reference:</span> {statusResult.operator_reference}</p>
                    )}
                    {statusResult.amount != null && (
                      <p className="text-sm"><span className="font-medium">Amount:</span> ₹{Number(statusResult.amount).toLocaleString("en-IN")}</p>
                    )}
                    {statusResult.charge != null && (
                      <p className="text-sm"><span className="font-medium">Charge:</span> ₹{Number(statusResult.charge).toLocaleString("en-IN")}</p>
                    )}
                    {statusResult.created_at && (
                      <p className="text-sm"><span className="font-medium">Created:</span> {new Date(statusResult.created_at).toLocaleString()}</p>
                    )}
                    {statusResult.updated_at && (
                      <p className="text-sm"><span className="font-medium">Updated:</span> {new Date(statusResult.updated_at).toLocaleString()}</p>
                    )}
                    {statusResult.request_id && (
                      <p className="text-xs text-muted-foreground">Request ID: {statusResult.request_id}</p>
                    )}
                    {statusResult.status === "PENDING" && (
                      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-100 p-3 text-sm text-amber-900">
                        Still processing. {polling ? "Auto-polling every 30s." : "Wait 30-60s and check again."} <strong>Do NOT retry the payment.</strong>
                      </div>
                    )}
                    {statusResult.status === "FAILED" && (
                      <div className="mt-3 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-900">
                        Payment failed. Wallet has been auto-refunded — safe to retry the full flow.
                      </div>
                    )}
                    {statusResult.status === "REFUNDED" && (
                      <div className="mt-3 rounded-lg border border-blue-300 bg-blue-100 p-3 text-sm text-blue-900">
                        Payment was refunded. Wallet has been credited back — safe to retry.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-red-800">
                      {statusResult.error?.code ? `[${statusResult.error.code}] ` : ""}
                      {statusResult.error?.message || "Could not retrieve status"}
                    </p>
                    {statusResult.error?.code && ERROR_HINTS[statusResult.error.code] && (
                      <p className="text-sm text-red-700">{ERROR_HINTS[statusResult.error.code]}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {statusResult?.status === "PENDING" && !polling && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => runStatusCheck(statusTxnId.trim() || undefined, statusRequestId.trim() || undefined)}
              >
                <RefreshCw className="h-4 w-4" />
                Recheck Status
              </Button>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={resetFlow}>
                <CreditCard className="h-4 w-4" />
                New Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
