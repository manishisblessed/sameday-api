"use client";

import { useCallback, useEffect, useState } from "react";
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
  Receipt,
  Lock,
  KeyRound,
  ShieldCheck,
  BadgeCheck,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchPay2NewBillers,
  fetchPay2NewCharges,
  fetchPay2NewBill,
  payPay2NewBill,
  checkPay2NewBillStatus,
} from "@/lib/client-api";
import type {
  Pay2NewBiller,
  Pay2NewFetchBillResponse,
  Pay2NewChargesResponse,
  Pay2NewPayBillResponse,
  Pay2NewBillStatusResponse,
} from "@/lib/types";

type Step = "billers" | "bill-form" | "bill-details" | "charges" | "payment-result" | "check-status";

const BBPS2_TOKEN_KEY = "bbps2_unlock_token";

function Bbps2PasswordGate({ onUnlock, onBack }: { onUnlock: () => void; onBack: () => void }) {
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
        if (d.success && d.passwordDisabled && d.token) {
          sessionStorage.setItem(BBPS2_TOKEN_KEY, d.token);
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
        sessionStorage.setItem(BBPS2_TOKEN_KEY, data.token);
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
              BBPS-2 Credit Card Payment
            </h2>
            <p className="mx-auto mt-2 max-w-[340px] text-sm leading-relaxed text-slate-600">
              This area handles credit card bill payments via Pay2New. Enter the access password to continue.
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
                  <label htmlFor="bbps2-pw" className="text-sm font-medium text-slate-800">Access password</label>
                  <Input
                    id="bbps2-pw"
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

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wide text-slate-400">
                    <span className="bg-gradient-to-b from-white to-slate-50/80 px-3">or</span>
                  </div>
                </div>

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

export function Bbps2CreditCardDashboard({ onBack }: Props) {
  const [authState, setAuthState] = useState<"checking" | "locked" | "unlocked">("checking");

  useEffect(() => {
    const token = sessionStorage.getItem(BBPS2_TOKEN_KEY);
    fetch("/api/bbps/check-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token || "" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.passwordDisabled || d.valid) {
          setAuthState("unlocked");
        } else {
          setAuthState("locked");
        }
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
    return <Bbps2PasswordGate onUnlock={() => setAuthState("unlocked")} onBack={onBack} />;
  }

  return <Bbps2DashboardContent onBack={onBack} />;
}

function Bbps2DashboardContent({ onBack }: Props) {
  const [step, setStep] = useState<Step>("billers");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Billers
  const [billers, setBillers] = useState<Pay2NewBiller[]>([]);
  const [billerSearch, setBillerSearch] = useState("");
  const [selectedBiller, setSelectedBiller] = useState<Pay2NewBiller | null>(null);

  // Bill form
  const [cardNumber, setCardNumber] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");

  // Bill data
  const [billData, setBillData] = useState<Pay2NewFetchBillResponse | null>(null);
  const [billFetchRef, setBillFetchRef] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  // Charges
  const [chargesData, setChargesData] = useState<Pay2NewChargesResponse | null>(null);

  // Payment
  const [paymentResult, setPaymentResult] = useState<Pay2NewPayBillResponse | null>(null);

  // Status check
  const [statusResult, setStatusResult] = useState<Pay2NewBillStatusResponse | null>(null);
  const [statusOrderId, setStatusOrderId] = useState("");
  const [statusRequestId, setStatusRequestId] = useState("");

  // Stats
  const [stats, setStats] = useState({ totalRequests: 0, totalAmount: 0, success: 0, failed: 0 });

  const loadBillers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPay2NewBillers();
      if (res.success && res.billers) {
        setBillers(res.billers);
      } else {
        setError(res.error?.message || "Failed to load billers");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load billers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBillers();
  }, [loadBillers]);

  const handleSelectBiller = (biller: Pay2NewBiller) => {
    setSelectedBiller(biller);
    setStep("bill-form");
    setError(null);
  };

  const handleFetchBill = async () => {
    if (!selectedBiller || !cardNumber.trim() || !customerNumber.trim()) return;
    setLoading(true);
    setError(null);
    setStats((s) => ({ ...s, totalRequests: s.totalRequests + 1 }));
    try {
      const res = await fetchPay2NewBill({
        number: cardNumber.trim(),
        product_code: selectedBiller.product_code,
        customer_number: customerNumber.trim(),
        optional1: customerNumber.trim(),
        optional2: "",
        optional3: "",
        optional4: "",
        pincode: "414002",
      });
      if (res.success) {
        setBillData(res);
        setBillFetchRef(res.order_id || "");
        setStep("bill-details");
      } else {
        setError(res.error?.message || "Failed to fetch bill");
        setStats((s) => ({ ...s, failed: s.failed + 1 }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch bill");
      setStats((s) => ({ ...s, failed: s.failed + 1 }));
    } finally {
      setLoading(false);
    }
  };

  const getPayAmount = () => {
    if (useCustomAmount && customAmount.trim()) {
      return Number(customAmount);
    }
    return Number(billData?.data?.amount || 0);
  };

  const handleCheckCharges = async () => {
    const payAmount = getPayAmount();
    if (!payAmount || payAmount <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPay2NewCharges({
        amount: payAmount,
      });
      if (res.success) {
        setChargesData(res);
        setStep("charges");
      } else {
        setError(res.error?.message || "Failed to check charges");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to check charges");
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = async () => {
    const payAmount = getPayAmount();
    if (!selectedBiller || !payAmount || !billFetchRef) return;
    setLoading(true);
    setError(null);
    setStats((s) => ({ ...s, totalRequests: s.totalRequests + 1 }));
    try {
      const res = await payPay2NewBill({
        number: cardNumber.trim(),
        amount: payAmount,
        product_code: selectedBiller.product_code,
        product_name: selectedBiller.product_name,
        bill_fetch_ref: billFetchRef,
        customer_number: customerNumber.trim(),
        optional1: customerNumber.trim(),
        optional2: "",
        optional3: "",
        optional4: "",
        pincode: "414002",
      });
      setPaymentResult(res);
      setStep("payment-result");
      if (res.success) {
        setStats((s) => ({
          ...s,
          success: s.success + 1,
          totalAmount: s.totalAmount + payAmount,
        }));
      } else {
        setStats((s) => ({ ...s, failed: s.failed + 1 }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setStats((s) => ({ ...s, failed: s.failed + 1 }));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (orderId?: string, requestId?: string) => {
    const oid = orderId || statusOrderId.trim();
    const rid = requestId || statusRequestId.trim();
    if (!oid && !rid) return;
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = {};
      if (oid) body.order_id = oid;
      if (rid) body.request_id = rid;
      const res = await checkPay2NewBillStatus(body);
      setStatusResult(res);
      if (!res.success) {
        setError(res.error?.message || "Status check failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status check failed");
    } finally {
      setLoading(false);
    }
  };

  const openStatusCheck = (orderId?: string, requestId?: string) => {
    setStatusResult(null);
    setStatusOrderId(orderId || "");
    setStatusRequestId(requestId || "");
    setStep("check-status");
    setError(null);
    if (orderId || requestId) {
      handleCheckStatus(orderId, requestId);
    }
  };

  const resetFlow = () => {
    setStep("billers");
    setSelectedBiller(null);
    setCardNumber("");
    setCustomerNumber("");
    setBillData(null);
    setBillFetchRef("");
    setCustomAmount("");
    setUseCustomAmount(false);
    setChargesData(null);
    setPaymentResult(null);
    setStatusResult(null);
    setStatusOrderId("");
    setStatusRequestId("");
    setError(null);
  };

  const goBack = () => {
    setError(null);
    switch (step) {
      case "bill-form":
        setStep("billers");
        setSelectedBiller(null);
        break;
      case "bill-details":
        setStep("bill-form");
        setBillData(null);
        setBillFetchRef("");
        break;
      case "charges":
        setStep("bill-details");
        setChargesData(null);
        break;
      case "payment-result":
        setStep("charges");
        setPaymentResult(null);
        break;
      case "check-status":
        if (paymentResult) {
          setStep("payment-result");
        } else {
          setStep("billers");
        }
        setStatusResult(null);
        break;
    }
  };

  const filteredBillers = billers.filter((b) =>
    b.product_name.toLowerCase().includes(billerSearch.toLowerCase())
  );

  const errorDetails: Record<string, string> = {
    INSUFFICIENT_BALANCE: "Partner wallet balance is low. Please recharge wallet to proceed.",
    WALLET_FROZEN: "Partner wallet is frozen. Contact SameDaySolution admin.",
    PAYMENT_FAILED: "Payment failed at provider. Wallet amount has been auto-refunded.",
    PROVIDER_ERROR: "Provider communication error. Wallet amount has been auto-refunded.",
    UNAUTHORIZED: "Invalid API key, expired timestamp, or bad signature.",
  };

  const getErrorHint = (code?: string) => {
    if (!code) return null;
    return errorDetails[code] || null;
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">BBPS-2 Credit Card Payment</h1>
          <p className="text-sm text-muted-foreground">
            Pay credit card bills via Pay2New ({billers.length} billers available)
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {step !== "billers" && (
            <Button variant="outline" size="sm" onClick={goBack}>
              <MoveLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {step !== "billers" && (
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
        {(step === "check-status"
          ? ["Billers", "Card Details", "Fetch Bill", "Charges", "Pay Bill", "Status"]
          : ["Billers", "Card Details", "Fetch Bill", "Charges", "Pay Bill"]
        ).map((s, i) => {
          const stepNames: Step[] = step === "check-status"
            ? ["billers", "bill-form", "bill-details", "charges", "payment-result", "check-status"]
            : ["billers", "bill-form", "bill-details", "charges", "payment-result"];
          const currentIdx = stepNames.indexOf(step);
          const isActive = i <= currentIdx;
          return (
            <span key={s} className="flex items-center gap-1 whitespace-nowrap">
              <span className={`px-2 py-0.5 rounded-full ${isActive ? "bg-green-100 text-green-800 font-medium" : "bg-muted"}`}>
                {s}
              </span>
              {i < stepNames.length - 1 && <ChevronRight className="h-3 w-3" />}
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

      {/* Step: Billers */}
      {!loading && step === "billers" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Select Credit Card Biller
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search billers..."
                className="pl-9"
                value={billerSearch}
                onChange={(e) => setBillerSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[480px] overflow-y-auto">
              {filteredBillers.map((biller) => (
                <button
                  key={biller.product_code}
                  onClick={() => handleSelectBiller(biller)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium">{biller.product_name}</p>
                    <p className="text-xs text-muted-foreground">Code: {biller.product_code}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
            {filteredBillers.length === 0 && !loading && (
              <p className="text-center text-sm text-muted-foreground py-8">
                {billers.length === 0 ? "No billers loaded. Check API connectivity." : "No matching billers found."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Bill Form — Enter Card + Mobile */}
      {!loading && step === "bill-form" && selectedBiller && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {selectedBiller.product_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Last 4 Digits of Card <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. 5008"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                />
                <p className="text-[11px] text-muted-foreground">Last 4 digits of credit card number</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Registered Mobile Number <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="10-digit registered mobile"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                />
                <p className="text-[11px] text-muted-foreground">Mobile number linked with the credit card</p>
              </div>
            </div>

            <Button
              onClick={handleFetchBill}
              disabled={cardNumber.length < 4 || customerNumber.length < 10}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              <Search className="h-4 w-4" />
              Fetch Bill
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Bill Details */}
      {!loading && step === "bill-details" && billData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Bill Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
              {billData.data?.customer_name && (
                <p className="text-sm">
                  <span className="font-medium">Customer:</span> {billData.data.customer_name}
                </p>
              )}
              {billData.data?.amount != null && (
                <p className="text-lg font-bold text-green-800">
                  Amount: ₹{Number(billData.data.amount).toLocaleString("en-IN")}
                </p>
              )}
              {billData.data?.bill_date && (
                <p className="text-sm"><span className="font-medium">Bill Date:</span> {billData.data.bill_date}</p>
              )}
              {(billData.data?.bill_due_date || billData.data?.due_date) && (
                <p className="text-sm"><span className="font-medium">Due Date:</span> {billData.data.bill_due_date || billData.data.due_date}</p>
              )}
              {billData.data?.["Minimum Amount Due"] && (
                <p className="text-sm"><span className="font-medium">Minimum Amount Due:</span> ₹{Number(billData.data["Minimum Amount Due"]).toLocaleString("en-IN")}</p>
              )}
              {billData.data?.["Maximum Permissible Amount"] && (
                <p className="text-sm"><span className="font-medium">Max Permissible:</span> ₹{Number(billData.data["Maximum Permissible Amount"]).toLocaleString("en-IN")}</p>
              )}
              {billFetchRef && (
                <p className="text-xs text-muted-foreground">Order ID (bill_fetch_ref): {billFetchRef}</p>
              )}
              {billData.request_id && (
                <p className="text-xs text-muted-foreground">Request ID: {billData.request_id}</p>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold">Payment Amount</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="amount-type"
                    checked={!useCustomAmount}
                    onChange={() => setUseCustomAmount(false)}
                    className="accent-green-700"
                  />
                  <span className="text-sm">Full Amount (₹{Number(billData.data?.amount || 0).toLocaleString("en-IN")})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="amount-type"
                    checked={useCustomAmount}
                    onChange={() => setUseCustomAmount(true)}
                    className="accent-green-700"
                  />
                  <span className="text-sm">Custom Amount</span>
                </label>
              </div>
              {useCustomAmount && (
                <div className="space-y-1.5 max-w-xs">
                  <Input
                    type="number"
                    placeholder="Enter amount in ₹"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min={1}
                  />
                  {billData.data?.["Minimum Amount Due"] && (
                    <p className="text-[11px] text-muted-foreground">
                      Min: ₹{Number(billData.data["Minimum Amount Due"]).toLocaleString("en-IN")} · Max: ₹{Number(billData.data["Maximum Permissible Amount"] || billData.data.amount || 0).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={() => handleCheckCharges()}
              disabled={useCustomAmount ? !customAmount.trim() || Number(customAmount) <= 0 : !billData.data?.amount}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              <Wallet className="h-4 w-4" />
              Check Charges &amp; Proceed
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Charges Confirmation */}
      {!loading && step === "charges" && chargesData && billData && (
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
                <span className="text-muted-foreground">Bill Amount</span>
                <span className="font-medium">₹{Number(chargesData.amount || billData.data?.amount || 0).toLocaleString("en-IN")}</span>
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
                    <span className="text-lg font-bold text-green-800">
                      ₹{((chargesData.amount || billData.data?.amount || 0) + chargesData.charges.total_charge).toLocaleString("en-IN")}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <strong>Confirm:</strong> Clicking &quot;Pay Now&quot; will debit ₹{((chargesData.amount || billData.data?.amount || 0) + (chargesData.charges?.total_charge || 0)).toLocaleString("en-IN")} from your partner wallet for {selectedBiller?.product_name}.
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handlePayBill}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
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
      {!loading && step === "payment-result" && paymentResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {paymentResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Payment {paymentResult.success ? "Successful" : "Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`rounded-lg border p-5 space-y-3 ${paymentResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              {paymentResult.success ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <BadgeCheck className="h-6 w-6 text-green-600" />
                    <span className="text-lg font-semibold text-green-800">Bill Paid Successfully</span>
                  </div>
                  {paymentResult.order_id && (
                    <p className="text-sm"><span className="font-medium">Order ID:</span> {paymentResult.order_id}</p>
                  )}
                  {paymentResult.operator_reference && (
                    <p className="text-sm"><span className="font-medium">Operator Reference:</span> {paymentResult.operator_reference}</p>
                  )}
                  {paymentResult.amount != null && (
                    <p className="text-sm"><span className="font-medium">Amount Paid:</span> ₹{Number(paymentResult.amount).toLocaleString("en-IN")}</p>
                  )}
                  {paymentResult.charge != null && (
                    <p className="text-sm"><span className="font-medium">Service Charge:</span> ₹{Number(paymentResult.charge).toLocaleString("en-IN")}</p>
                  )}
                  {paymentResult.request_id && (
                    <p className="text-xs text-muted-foreground">Request ID: {paymentResult.request_id}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-red-800">
                    {paymentResult.error?.code ? `[${paymentResult.error.code}] ` : ""}
                    {paymentResult.error?.message || "Payment failed"}
                  </p>
                  {paymentResult.error?.code && getErrorHint(paymentResult.error.code) && (
                    <p className="text-sm text-red-700 mt-1">{getErrorHint(paymentResult.error.code)}</p>
                  )}
                  {paymentResult.wallet_balance != null && (
                    <p className="text-sm text-red-700">Wallet Balance: ₹{paymentResult.wallet_balance.toLocaleString("en-IN")}</p>
                  )}
                  {paymentResult.required_amount != null && (
                    <p className="text-sm text-red-700">Required Amount: ₹{paymentResult.required_amount.toLocaleString("en-IN")}</p>
                  )}
                  {paymentResult.request_id && (
                    <p className="text-xs text-muted-foreground">Request ID: {paymentResult.request_id}</p>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              {(paymentResult.request_id || paymentResult.order_id) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openStatusCheck(paymentResult.order_id, paymentResult.request_id)}
                >
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
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Order ID</label>
                <Input
                  placeholder="e.g. P2N_PAY_9876543210"
                  value={statusOrderId}
                  onChange={(e) => setStatusOrderId(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Request ID</label>
                <Input
                  placeholder="e.g. SDS1719720000002"
                  value={statusRequestId}
                  onChange={(e) => setStatusRequestId(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Provide either Order ID or Request ID (at least one required).
            </p>
            <Button
              onClick={() => handleCheckStatus()}
              disabled={!statusOrderId.trim() && !statusRequestId.trim()}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              <Search className="h-4 w-4" />
              Check Status
            </Button>

            {statusResult && (
              <div className={`rounded-lg border p-5 space-y-3 ${
                statusResult.status === "SUCCESS" ? "border-green-200 bg-green-50" :
                statusResult.status === "PENDING" ? "border-amber-200 bg-amber-50" :
                statusResult.status === "REFUNDED" ? "border-blue-200 bg-blue-50" :
                "border-red-200 bg-red-50"
              }`}>
                {statusResult.success ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      {statusResult.status === "SUCCESS" && <BadgeCheck className="h-6 w-6 text-green-600" />}
                      {statusResult.status === "PENDING" && <Loader2 className="h-6 w-6 text-amber-600" />}
                      {statusResult.status === "FAILED" && <XCircle className="h-6 w-6 text-red-600" />}
                      {statusResult.status === "REFUNDED" && <ArrowLeftRight className="h-6 w-6 text-blue-600" />}
                      <span className={`text-lg font-semibold ${
                        statusResult.status === "SUCCESS" ? "text-green-800" :
                        statusResult.status === "PENDING" ? "text-amber-800" :
                        statusResult.status === "REFUNDED" ? "text-blue-800" :
                        "text-red-800"
                      }`}>
                        {statusResult.status}
                      </span>
                    </div>
                    {statusResult.order_id && (
                      <p className="text-sm"><span className="font-medium">Order ID:</span> {statusResult.order_id}</p>
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
                        Transaction is still being processed. Wait 30-60 seconds and check again. <strong>Do NOT retry the payment.</strong>
                      </div>
                    )}
                    {statusResult.status === "FAILED" && (
                      <div className="mt-3 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-900">
                        Payment failed. Wallet amount has been auto-refunded. You may retry the payment flow.
                      </div>
                    )}
                    {statusResult.status === "REFUNDED" && (
                      <div className="mt-3 rounded-lg border border-blue-300 bg-blue-100 p-3 text-sm text-blue-900">
                        Payment was refunded. Wallet has been credited back.
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-medium text-red-800">
                    {statusResult.error?.code ? `[${statusResult.error.code}] ` : ""}
                    {statusResult.error?.message || "Could not retrieve status"}
                  </p>
                )}
              </div>
            )}

            {statusResult?.status === "PENDING" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCheckStatus()}
              >
                <Search className="h-4 w-4" />
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
