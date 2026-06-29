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
  FileWarning,
  Clock,
  Lock,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchBbpsCategories,
  fetchBbpsBillers,
  fetchBbpsBillerInfo,
  fetchBbpsBill,
  payBbpsBill,
  fetchBbpsTransactionStatus,
  registerBbpsComplaint,
  trackBbpsComplaint,
} from "@/lib/client-api";
import type {
  BbpsBiller,
  BbpsBillerInfo,
  BbpsInputParam,
  BbpsFetchBillResponse,
  BbpsPayBillResponse,
  BbpsTransactionStatusResponse,
  BbpsComplaintRegisterResponse,
  BbpsComplaintTrackResponse,
} from "@/lib/types";

type Step = "categories" | "billers" | "biller-info" | "fetch-bill" | "pay-bill" | "status";

const BBPS_TOKEN_KEY = "bbps_unlock_token";

function BbpsPasswordGate({ onUnlock, onBack }: { onUnlock: () => void; onBack: () => void }) {
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
          sessionStorage.setItem(BBPS_TOKEN_KEY, d.token);
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
        sessionStorage.setItem(BBPS_TOKEN_KEY, data.token);
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
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(16,185,129,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/3 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-1/4 h-56 w-56 rounded-full bg-teal-300/15 blur-3xl"
        aria-hidden
      />

      <div className="relative flex min-h-[inherit] flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-300">
          <div className="mb-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600/90">Protected</p>
            <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
              BBPS Bill Payment
            </h2>
            <p className="mx-auto mt-2 max-w-[340px] text-sm leading-relaxed text-slate-600">
              This area handles bill payments via BBPS. Enter the access password to continue.
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
                  <label htmlFor="bbps-pw" className="text-sm font-medium text-slate-800">
                    Access password
                  </label>
                  <Input
                    id="bbps-pw"
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
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-sm text-red-800"
                  >
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
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <KeyRound className="h-5 w-5" />
                  )}
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

          <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
            Session unlock is stored until you close this browser tab.
          </p>
        </div>
      </div>
    </div>
  );
}

interface Props {
  onBack: () => void;
}

export function BbpsDashboard({ onBack }: Props) {
  const [authState, setAuthState] = useState<"checking" | "locked" | "unlocked">("checking");

  useEffect(() => {
    const token = sessionStorage.getItem(BBPS_TOKEN_KEY);

    fetch("/api/bbps/check-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token || "" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.passwordDisabled) {
          setAuthState("unlocked");
        } else if (d.valid) {
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
    return <BbpsPasswordGate onUnlock={() => setAuthState("unlocked")} onBack={onBack} />;
  }

  return <BbpsDashboardContent onBack={onBack} />;
}

function BbpsDashboardContent({ onBack }: Props) {
  const [step, setStep] = useState<Step>("categories");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [billers, setBillers] = useState<BbpsBiller[]>([]);
  const [selectedBiller, setSelectedBiller] = useState<BbpsBiller | null>(null);
  const [billerInfo, setBillerInfo] = useState<BbpsBillerInfo | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [billData, setBillData] = useState<BbpsFetchBillResponse | null>(null);
  const [paymentResult, setPaymentResult] = useState<BbpsPayBillResponse | null>(null);
  const [statusResult, setStatusResult] = useState<BbpsTransactionStatusResponse | null>(null);

  // Payment form fields
  const [retailerId, setRetailerId] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");

  // Complaint state
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintTxnId, setComplaintTxnId] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintResult, setComplaintResult] = useState<BbpsComplaintRegisterResponse | null>(null);
  const [complaintTrackId, setComplaintTrackId] = useState("");
  const [complaintTrackResult, setComplaintTrackResult] = useState<BbpsComplaintTrackResponse | null>(null);

  // Status check state
  const [statusCheckTxnId, setStatusCheckTxnId] = useState("");

  // Search/filter
  const [categorySearch, setCategorySearch] = useState("");
  const [billerSearch, setBillerSearch] = useState("");

  // Stats tracking
  const [stats, setStats] = useState({ totalRequests: 0, totalAmount: 0, success: 0, failed: 0 });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBbpsCategories();
      if (res.success && res.categories) {
        setCategories(res.categories);
      } else {
        setError(res.error?.message || "Failed to load categories");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSelectCategory = async (category: string) => {
    setSelectedCategory(category);
    setStep("billers");
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBbpsBillers(category);
      if (res.success && res.data) {
        setBillers(res.data);
      } else {
        setError(res.error?.message || "Failed to load billers");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load billers");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBiller = async (biller: BbpsBiller) => {
    setSelectedBiller(biller);
    setStep("biller-info");
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBbpsBillerInfo(biller.biller_id);
      if (res.success && res.biller_info) {
        setBillerInfo(res.biller_info);
        const defaults: Record<string, string> = {};
        res.biller_info.billerInputParams?.forEach((p) => {
          defaults[p.paramName] = "";
        });
        setInputValues(defaults);
      } else {
        setError(res.error?.message || "Failed to load biller info");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load biller info");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchBill = async () => {
    if (!selectedBiller || !billerInfo) return;
    setStep("fetch-bill");
    setLoading(true);
    setError(null);
    setStats((s) => ({ ...s, totalRequests: s.totalRequests + 1 }));
    try {
      const input_params = Object.entries(inputValues)
        .filter(([, v]) => v.trim())
        .map(([paramName, paramValue]) => ({ paramName, paramValue }));
      const consumerNumber = input_params[0]?.paramValue || "";

      const res = await fetchBbpsBill({
        biller_id: selectedBiller.biller_id,
        consumer_number: consumerNumber,
        input_params,
        payment_mode: "cash",
        init_channel: "AGT",
      });

      if (res.success) {
        setBillData(res);
        setStats((s) => ({ ...s, success: s.success + 1 }));
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

  const handlePayBill = async () => {
    if (!selectedBiller || !billData || !retailerId.trim()) return;
    setStep("pay-bill");
    setLoading(true);
    setError(null);
    setStats((s) => ({ ...s, totalRequests: s.totalRequests + 1 }));

    const billAmount = billData.bill?.bill_amount
      ? Number(billData.bill.bill_amount)
      : billData.data?.billerResponse?.billAmount
        ? Number(billData.data.billerResponse.billAmount)
        : 0;

    try {
      const input_params = Object.entries(inputValues)
        .filter(([, v]) => v.trim())
        .map(([paramName, paramValue]) => ({ paramName, paramValue }));

      const res = await payBbpsBill({
        retailer_id: retailerId,
        biller_id: selectedBiller.biller_id,
        biller_name: selectedBiller.biller_name,
        consumer_number: input_params[0]?.paramValue || "",
        amount: billAmount,
        consumer_name: billData.bill?.consumer_name || billData.data?.billerResponse?.customerName || "",
        biller_category: selectedCategory || "",
        reqId: billData.reqId || "",
        payment_mode: paymentMode,
        pan_number: panNumber || undefined,
        additional_info: {
          category: selectedCategory || "",
          reqId: billData.reqId || "",
          inputParams: input_params,
          billerResponse: billData.data?.billerResponse || {},
          additionalInfo: billData.data?.additionalInfo || [],
        },
      });

      setPaymentResult(res);
      if (res.success) {
        setStats((s) => ({
          ...s,
          success: s.success + 1,
          totalAmount: s.totalAmount + billAmount,
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

  const handleCheckStatus = async (txnId?: string) => {
    const id = txnId || statusCheckTxnId || paymentResult?.bbps_transaction_id;
    if (!id) return;
    setStep("status");
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBbpsTransactionStatus({
        transaction_id: id,
        track_type: "TRANS_REF_ID",
      });
      setStatusResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status check failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterComplaint = async () => {
    if (!complaintTxnId.trim() || !complaintDesc.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await registerBbpsComplaint({
        transaction_id: complaintTxnId,
        complaint_type: "BBPS",
        description: complaintDesc,
        complaint_disposition: complaintDesc,
      });
      setComplaintResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Complaint registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackComplaint = async () => {
    if (!complaintTrackId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await trackBbpsComplaint({
        complaint_id: complaintTrackId,
        complaint_type: "Service",
      });
      setComplaintTrackResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Complaint tracking failed");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep("categories");
    setSelectedCategory(null);
    setBillers([]);
    setSelectedBiller(null);
    setBillerInfo(null);
    setInputValues({});
    setBillData(null);
    setPaymentResult(null);
    setStatusResult(null);
    setError(null);
    setPanNumber("");
    setRetailerId("");
  };

  const goBack = () => {
    setError(null);
    switch (step) {
      case "billers":
        setStep("categories");
        setSelectedCategory(null);
        setBillers([]);
        break;
      case "biller-info":
        setStep("billers");
        setSelectedBiller(null);
        setBillerInfo(null);
        break;
      case "fetch-bill":
        setStep("biller-info");
        setBillData(null);
        break;
      case "pay-bill":
        setStep("fetch-bill");
        setPaymentResult(null);
        break;
      case "status":
        if (paymentResult) setStep("pay-bill");
        else setStep("categories");
        setStatusResult(null);
        break;
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const filteredBillers = billers.filter((b) =>
    b.biller_name.toLowerCase().includes(billerSearch.toLowerCase())
  );

  const formatAmount = (paise: number | string) => {
    const p = Number(paise);
    if (!p) return "₹0";
    return `₹${(p / 100).toLocaleString("en-IN")}`;
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">BBPS Bill Payment</h1>
          <p className="text-sm text-muted-foreground">
            Pay bills across {categories.length || "all"} categories via BBPS
          </p>
        </div>
        <div className="flex gap-2">
          {step !== "categories" && (
            <Button variant="outline" size="sm" onClick={goBack}>
              <MoveLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {step !== "categories" && (
            <Button variant="outline" size="sm" onClick={resetFlow}>
              New Payment
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowComplaint(!showComplaint)}>
            <FileWarning className="h-4 w-4" />
            {showComplaint ? "Hide" : "Complaints"}
          </Button>
          <Button variant="outline" size="sm" onClick={onBack}>
            <MoveLeft className="h-4 w-4" />
            Change API
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={stats.totalRequests} icon={ArrowLeftRight} accent="blue" />
        <StatCard label="Total Amount" value={`₹${(stats.totalAmount / 100).toLocaleString("en-IN")}`} icon={IndianRupee} accent="green" />
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
        {["Categories", "Billers", "Bill Details", "Fetch Bill", "Pay Bill", "Status"].map((s, i) => {
          const stepNames: Step[] = ["categories", "billers", "biller-info", "fetch-bill", "pay-bill", "status"];
          const currentIdx = stepNames.indexOf(step);
          const isActive = i <= currentIdx;
          return (
            <span key={s} className="flex items-center gap-1 whitespace-nowrap">
              <span className={`px-2 py-0.5 rounded-full ${isActive ? "bg-green-100 text-green-800 font-medium" : "bg-muted"}`}>
                {s}
              </span>
              {i < 5 && <ChevronRight className="h-3 w-3" />}
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

      {/* Step: Categories */}
      {!loading && step === "categories" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Select Bill Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                className="pl-9"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[480px] overflow-y-auto">
              {filteredCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors text-left text-sm font-medium"
                >
                  {cat}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
            {filteredCategories.length === 0 && !loading && (
              <p className="text-center text-sm text-muted-foreground py-8">
                {categories.length === 0 ? "No categories loaded. Check API connectivity." : "No matching categories found."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Billers */}
      {!loading && step === "billers" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Billers — {selectedCategory}
              <span className="text-xs font-normal text-muted-foreground ml-2">({billers.length} found)</span>
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
            <div className="space-y-1 max-h-[480px] overflow-y-auto">
              {filteredBillers.map((biller) => (
                <button
                  key={biller.biller_id}
                  onClick={() => handleSelectBiller(biller)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium">{biller.biller_name}</p>
                    <p className="text-xs text-muted-foreground">ID: {biller.biller_id}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
            {filteredBillers.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No billers found.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Biller Info — Fill Input Params */}
      {!loading && step === "biller-info" && billerInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {billerInfo.billerName}
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {billerInfo.amountExactness && `Amount: ${billerInfo.amountExactness}`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {billerInfo.billerInputParams?.map((param: BbpsInputParam) => (
                <div key={param.paramName} className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {param.paramName}
                    {param.isOptional === false || param.isOptional === "false" ? (
                      <span className="text-red-500 ml-0.5">*</span>
                    ) : null}
                  </label>
                  {param.values && param.values.length > 0 ? (
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={inputValues[param.paramName] || ""}
                      onChange={(e) => setInputValues((v) => ({ ...v, [param.paramName]: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      {param.values.map((val) => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder={`Enter ${param.paramName}`}
                      value={inputValues[param.paramName] || ""}
                      onChange={(e) => setInputValues((v) => ({ ...v, [param.paramName]: e.target.value }))}
                      maxLength={param.maxLength || undefined}
                    />
                  )}
                  {param.minLength || param.maxLength ? (
                    <p className="text-[11px] text-muted-foreground">
                      {param.minLength && `Min: ${param.minLength}`}
                      {param.minLength && param.maxLength && " · "}
                      {param.maxLength && `Max: ${param.maxLength}`}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <Button
              onClick={handleFetchBill}
              disabled={!Object.values(inputValues).some((v) => v.trim())}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              <Search className="h-4 w-4" />
              Fetch Bill
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Fetch Bill — Show Bill Details */}
      {!loading && step === "fetch-bill" && billData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Bill Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
              {billData.bill?.consumer_name || billData.data?.billerResponse?.customerName ? (
                <p className="text-sm">
                  <span className="font-medium">Customer:</span>{" "}
                  {billData.bill?.consumer_name || billData.data?.billerResponse?.customerName}
                </p>
              ) : null}
              {(billData.bill?.bill_amount || billData.data?.billerResponse?.billAmount) && (
                <p className="text-lg font-bold text-green-800">
                  Amount: {formatAmount(billData.bill?.bill_amount || billData.data?.billerResponse?.billAmount || 0)}
                </p>
              )}
              {billData.data?.billerResponse?.billDate && (
                <p className="text-sm"><span className="font-medium">Bill Date:</span> {billData.data.billerResponse.billDate}</p>
              )}
              {billData.data?.billerResponse?.dueDate && (
                <p className="text-sm"><span className="font-medium">Due Date:</span> {billData.data.billerResponse.dueDate}</p>
              )}
              {billData.reqId && (
                <p className="text-xs text-muted-foreground">Request ID: {billData.reqId}</p>
              )}
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Payment Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Retailer ID <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="Enter retailer/partner ID"
                    value={retailerId}
                    onChange={(e) => setRetailerId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Payment Mode</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">PAN Number</label>
                  <Input
                    placeholder="Required for payments above ₹49,999"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                  <p className="text-[11px] text-muted-foreground">Format: ABCDE1234F</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePayBill}
              disabled={!retailerId.trim()}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              <CreditCard className="h-4 w-4" />
              Pay Bill
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Pay Bill — Show Result */}
      {!loading && step === "pay-bill" && paymentResult && (
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
            <div className={`rounded-lg border p-4 space-y-2 ${paymentResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              {paymentResult.transaction_id && (
                <p className="text-sm"><span className="font-medium">Transaction ID:</span> {paymentResult.transaction_id}</p>
              )}
              {paymentResult.bbps_transaction_id && (
                <p className="text-sm"><span className="font-medium">BBPS Transaction ID:</span> {paymentResult.bbps_transaction_id}</p>
              )}
              {paymentResult.agent_transaction_id && (
                <p className="text-sm"><span className="font-medium">Agent Ref:</span> {paymentResult.agent_transaction_id}</p>
              )}
              {paymentResult.status && (
                <p className="text-sm"><span className="font-medium">Status:</span> {paymentResult.status}</p>
              )}
              {paymentResult.error_code && (
                <p className="text-sm text-red-700"><span className="font-medium">Error:</span> {paymentResult.error_code} — {paymentResult.error_message}</p>
              )}
              {paymentResult.error?.message && (
                <p className="text-sm text-red-700">{paymentResult.error.message}</p>
              )}
              {paymentResult.wallet_balance !== undefined && (
                <p className="text-xs text-muted-foreground">Wallet Balance: ₹{paymentResult.wallet_balance}</p>
              )}
            </div>

            <div className="flex gap-2">
              {paymentResult.bbps_transaction_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckStatus(paymentResult.bbps_transaction_id)}
                >
                  <Clock className="h-4 w-4" />
                  Check Status
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={resetFlow}>
                New Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Transaction Status */}
      {!loading && step === "status" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Transaction Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusResult ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                {statusResult.data?.status && (
                  <p className="text-sm">
                    <span className="font-medium">Status:</span>{" "}
                    <span className={statusResult.data.status === "success" ? "text-green-700 font-semibold" : statusResult.data.status === "failed" ? "text-red-700 font-semibold" : "text-amber-700 font-semibold"}>
                      {statusResult.data.status}
                    </span>
                  </p>
                )}
                {statusResult.data?.totalAmount && (
                  <p className="text-sm"><span className="font-medium">Total Amount:</span> {formatAmount(statusResult.data.totalAmount)}</p>
                )}
                {statusResult.data?.serviceCharge && (
                  <p className="text-sm"><span className="font-medium">Service Charge:</span> {formatAmount(statusResult.data.serviceCharge)}</p>
                )}
                {statusResult.data?.referenceNo && (
                  <p className="text-sm"><span className="font-medium">Reference:</span> {statusResult.data.referenceNo}</p>
                )}
                {statusResult.data?.remark && (
                  <p className="text-sm"><span className="font-medium">Remark:</span> {statusResult.data.remark}</p>
                )}
              </div>
            ) : null}

            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold">Check Another Transaction</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter BBPS Transaction ID"
                  value={statusCheckTxnId}
                  onChange={(e) => setStatusCheckTxnId(e.target.value)}
                />
                <Button
                  onClick={() => handleCheckStatus()}
                  disabled={!statusCheckTxnId.trim()}
                  className="bg-green-700 hover:bg-green-800 text-white shrink-0"
                >
                  Check
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complaint Section */}
      {showComplaint && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileWarning className="h-5 w-5" />
              Complaints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Register Complaint */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Register Complaint</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="BBPS Transaction ID"
                  value={complaintTxnId}
                  onChange={(e) => setComplaintTxnId(e.target.value)}
                />
                <Input
                  placeholder="Complaint description"
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegisterComplaint}
                disabled={!complaintTxnId.trim() || !complaintDesc.trim() || loading}
              >
                Register Complaint
              </Button>
              {complaintResult && (
                <div className={`rounded-lg border p-3 text-sm ${complaintResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  {complaintResult.success ? (
                    <>
                      <p className="font-medium text-green-800">Complaint Registered</p>
                      {complaintResult.data?.complaintId && <p>Complaint ID: {complaintResult.data.complaintId}</p>}
                      {complaintResult.data?.responseReason && <p>{complaintResult.data.responseReason}</p>}
                    </>
                  ) : (
                    <p className="text-red-700">{complaintResult.error?.message || "Registration failed"}</p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t" />

            {/* Track Complaint */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Track Complaint</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Complaint ID"
                  value={complaintTrackId}
                  onChange={(e) => setComplaintTrackId(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTrackComplaint}
                  disabled={!complaintTrackId.trim() || loading}
                  className="shrink-0"
                >
                  Track
                </Button>
              </div>
              {complaintTrackResult && (
                <div className={`rounded-lg border p-3 text-sm ${complaintTrackResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  {complaintTrackResult.success ? (
                    <>
                      {complaintTrackResult.data?.status && <p><span className="font-medium">Status:</span> {complaintTrackResult.data.status}</p>}
                      {complaintTrackResult.data?.resolution && <p><span className="font-medium">Resolution:</span> {complaintTrackResult.data.resolution}</p>}
                      {complaintTrackResult.data?.description && <p>{complaintTrackResult.data.description}</p>}
                    </>
                  ) : (
                    <p className="text-red-700">{complaintTrackResult.error?.message || "Tracking failed"}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
