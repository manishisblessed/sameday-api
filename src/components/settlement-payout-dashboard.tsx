"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MoveLeft,
  RefreshCw,
  Landmark,
  Search,
  Send,
  ShieldCheck,
  Loader2,
  Lock,
  KeyRound,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  fetchPayoutBalance,
  verifyPayoutAccount,
  sdsInitiateTransfer,
  sdsGetPayoutStatus,
  sdsListPayouts,
} from "@/lib/client-api";
import type { SdsPayoutTransaction } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive a human-readable bank name from the first 4 chars of an IFSC code. */
const IFSC_BANK_MAP: Record<string, string> = {
  HDFC: "HDFC Bank",
  SBIN: "State Bank of India",
  ICIC: "ICICI Bank",
  UTIB: "Axis Bank",
  PUNB: "Punjab National Bank",
  KKBK: "Kotak Mahindra Bank",
  BARB: "Bank of Baroda",
  CNRB: "Canara Bank",
  IOBA: "Indian Overseas Bank",
  UBIN: "Union Bank of India",
  IDBI: "IDBI Bank",
  YESB: "Yes Bank",
  INDB: "IndusInd Bank",
  FDRL: "Federal Bank",
  KVBL: "Karur Vysya Bank",
  CITI: "Citibank",
  HSBC: "HSBC Bank",
  SCBL: "Standard Chartered Bank",
  RATN: "RBL Bank",
  DCBL: "DCB Bank",
  MAHB: "Bank of Maharashtra",
  ALLA: "Allahabad Bank",
  ANDB: "Andhra Bank",
  CORP: "Corporation Bank",
  ORBC: "Oriental Bank of Commerce",
  VIJB: "Vijaya Bank",
  SBHY: "State Bank of Hyderabad",
  SBBJ: "State Bank of Bikaner and Jaipur",
  SBTR: "State Bank of Travancore",
  SBMY: "State Bank of Mysore",
  BKID: "Bank of India",
  CBIN: "Central Bank of India",
  LAVB: "Lakshmi Vilas Bank",
  TMBL: "Tamilnad Mercantile Bank",
  SIBL: "South Indian Bank",
  KARB: "Karnataka Bank",
  NKGS: "NKGSB Co-op Bank",
  AIRP: "Airtel Payments Bank",
  FINO: "Fino Payments Bank",
  IPOS: "India Post Payments Bank",
  JAKA: "Jammu & Kashmir Bank",
  COSB: "Cosmos Bank",
  SRCB: "Saraswat Bank",
  PSIB: "Punjab & Sind Bank",
};

function bankNameFromIfsc(ifsc: string): string {
  const prefix = ifsc.slice(0, 4).toUpperCase();
  return IFSC_BANK_MAP[prefix] ?? "";
}

function statusBadge(status?: string) {
  const s = (status ?? "").toUpperCase();
  if (s === "SUCCESS")
    return <Badge className="border-green-200 bg-green-50 text-green-800">SUCCESS</Badge>;
  if (s === "FAILED")
    return <Badge className="border-red-200 bg-red-50 text-red-800">FAILED</Badge>;
  if (s === "PENDING")
    return <Badge className="border-amber-200 bg-amber-50 text-amber-900">PENDING</Badge>;
  return <Badge variant="outline">{status ?? "—"}</Badge>;
}

const TOKEN_KEY = "settlement_unlock_token";

// ─── Password gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock, onBack }: { onUnlock: () => void; onBack: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingDisabled, setCheckingDisabled] = useState(true);

  useEffect(() => {
    fetch("/api/payout/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.passwordDisabled && d.token) {
          sessionStorage.setItem(TOKEN_KEY, d.token);
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
      const res = await fetch("/api/payout/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.success && data.token !== undefined) {
        sessionStorage.setItem(TOKEN_KEY, data.token);
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
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-slate-50 via-violet-50/30 to-emerald-50/20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(139,92,246,0.12),transparent)]" aria-hidden />
      <div className="relative flex min-h-[inherit] flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-300">
          <div className="mb-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600/90">Protected</p>
            <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-900">Settlement &amp; Payout</h2>
            <p className="mx-auto mt-2 max-w-[340px] text-sm leading-relaxed text-slate-600">
              This area handles IMPS/NEFT payouts. Enter the access password to continue.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15)] backdrop-blur-md">
            <div className="rounded-[0.9rem] bg-gradient-to-b from-white to-slate-50/80 px-6 pb-6 pt-7 sm:px-8">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-violet-400/25 to-emerald-400/20 blur-xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-500/30 ring-4 ring-white">
                    <ShieldCheck className="h-8 w-8 opacity-95" strokeWidth={1.5} />
                    <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-white bg-slate-900 text-white shadow-md">
                      <Lock className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="settlement-pw" className="text-sm font-medium text-slate-800">Access password</label>
                  <Input
                    id="settlement-pw"
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !loading && pw.trim() && submit()}
                    placeholder="••••••••"
                    className="h-11 rounded-xl border-slate-200 bg-white text-base shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-violet-500/25 md:text-sm"
                  />
                </div>
                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-sm text-red-800">{error}</div>
                )}
                <Button
                  type="button"
                  size="lg"
                  className="h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-[15px] font-semibold text-white shadow-md shadow-violet-500/25 transition hover:from-violet-700 hover:to-violet-800 disabled:opacity-60"
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

// ─── Main dashboard ────────────────────────────────────────────────────────────

type Props = { onBack: () => void };

export function SettlementPayoutDashboard({ onBack }: Props) {
  const [authState, setAuthState] = useState<"checking" | "locked" | "unlocked">("checking");

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    fetch("/api/payout/check-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token ?? "" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.passwordDisabled || d.valid) setAuthState("unlocked");
        else setAuthState("locked");
      })
      .catch(() => setAuthState("locked"));
  }, []);

  // ── Wallet balance ──────────────────────────────────────────────────────────
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletFrozen, setWalletFrozen] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const res = await fetchPayoutBalance();
      if (res.success) {
        setWalletBalance(res.balance ?? 0);
        setWalletFrozen(res.is_frozen ?? false);
      } else {
        setBalanceError(res.error?.message ?? "Could not load balance");
      }
    } catch (e) {
      setBalanceError(e instanceof Error ? e.message : String(e));
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => { loadBalance(); }, [loadBalance]);

  // ── Recent transactions ─────────────────────────────────────────────────────
  const [list, setList] = useState<SdsPayoutTransaction[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await sdsListPayouts(20);
      if (res.success && res.transactions) setList(res.transactions);
      else setListError(res.error?.message ?? "Could not load transactions");
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // ── Step 1 — account fields ─────────────────────────────────────────────────
  const [acct, setAcct] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [holderName, setHolderName] = useState("");
  const [mobile, setMobile] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  // Auto-fill bank name when user types a valid IFSC
  function handleIfscChange(v: string) {
    const up = v.toUpperCase();
    setIfsc(up);
    if (up.length >= 4) {
      const guess = bankNameFromIfsc(up);
      if (guess && !bankName) setBankName(guess);
    }
  }

  const onVerify = async () => {
    setVerifyMsg(null);
    setVerifyLoading(true);
    try {
      const res = await verifyPayoutAccount({
        accountNumber: acct.trim(),
        ifscCode: ifsc.trim(),
        bankName: bankName.trim() || undefined,
      });
      if (res.success && res.is_valid && res.account_holder_name) {
        setHolderName(res.account_holder_name);
        if (res.bank_name && !bankName) setBankName(res.bank_name);
        setVerifyMsg(res.message ?? "Account verified.");
      } else {
        setVerifyMsg(res.error?.message ?? res.message ?? "Verification did not succeed.");
      }
    } catch (e) {
      setVerifyMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setVerifyLoading(false);
    }
  };

  // ── Step 2 — transfer fields ────────────────────────────────────────────────
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"IMPS" | "NEFT">("IMPS");
  const [email, setEmail] = useState("");
  const [remarks, setRemarks] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMsg, setTransferMsg] = useState<string | null>(null);
  const [lastTxnId, setLastTxnId] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  const onTransfer = async () => {
    setTransferMsg(null);
    const amt = Number(amount);

    // Client-side validation
    if (!acct.trim())          { setTransferMsg("Account number is required."); return; }
    if (!ifsc.trim())          { setTransferMsg("IFSC code is required."); return; }
    if (!holderName.trim())    { setTransferMsg("Account holder name is required."); return; }
    if (!bankName.trim())      { setTransferMsg("Bank name is required."); return; }
    if (!/^\d{10}$/.test(mobile.trim())) { setTransferMsg("Mobile must be a 10-digit number."); return; }
    if (!Number.isFinite(amt) || amt < 100 || amt > 200_000) {
      setTransferMsg("Amount must be between ₹100 and ₹2,00,000."); return;
    }

    setTransferLoading(true);
    try {
      const idempotencyKey = `${acct.trim()}-${Date.now()}`;
      const res = await sdsInitiateTransfer(
        {
          accountNumber: acct.trim(),
          ifscCode: ifsc.trim(),
          accountHolderName: holderName.trim(),
          bankName: bankName.trim(),
          mobile: mobile.trim(),
          amount: amt,
          email: email.trim() || undefined,
          paymentMode: mode,
          remarks: remarks.trim() || undefined,
        },
        idempotencyKey,
      );

      if (res.transaction_id) {
        setLastTxnId(res.transaction_id);
        setLastStatus(res.status ?? null);
        setTransferMsg(
          res.message ??
            `${res.status ?? "PROCESSING"} · ₹${res.total_debited ?? amt}`,
        );
        loadList();
        loadBalance();
      } else {
        setTransferMsg(res.error?.message ?? res.message ?? "Transfer failed.");
      }
    } catch (e) {
      setTransferMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setTransferLoading(false);
    }
  };

  // ── Step 3 — status check ───────────────────────────────────────────────────
  const [statusId, setStatusId] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<SdsPayoutTransaction | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const onCheckStatus = async () => {
    const id = statusId.trim() || lastTxnId;
    if (!id) { setStatusError("Enter a transaction ID."); return; }
    setStatusLoading(true);
    setStatusResult(null);
    setStatusError(null);
    try {
      const res = await sdsGetPayoutStatus(id);
      if (res.success && res.transaction) setStatusResult(res.transaction);
      else setStatusError(res.error?.message ?? "Status lookup failed.");
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : String(e));
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Step navigation ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  if (authState === "checking") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }
  if (authState === "locked") {
    return <PasswordGate onUnlock={() => setAuthState("unlocked")} onBack={onBack} />;
  }

  // ── Shared styles ───────────────────────────────────────────────────────────
  const card = "rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-lg shadow-slate-900/[0.04] ring-1 ring-white/60 backdrop-blur";
  const cardInner = "rounded-[0.85rem] bg-gradient-to-b from-white to-slate-50/50 p-5 sm:p-6";
  const inp = "h-11 rounded-xl border-slate-200 bg-white text-sm shadow-inner shadow-slate-900/[0.03] placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-violet-500/20 transition-colors";
  const lbl = (t: string) => <label className="text-[13px] font-semibold text-slate-700">{t}</label>;

  const stepBtn = (n: number, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setStep(n as 1 | 2 | 3)}
      className={`group flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
        step === n
          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 scale-[1.02]"
          : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/80 hover:ring-violet-300 hover:text-violet-700 hover:shadow-md"
      }`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
        step === n ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-700"
      }`}>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-slate-50 via-violet-50/20 to-indigo-50/30">
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-violet-300/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-24 bottom-20 h-80 w-80 rounded-full bg-indigo-300/15 blur-3xl" aria-hidden />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-bottom-3 duration-400">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
              <Landmark className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Settlement &amp; Payout</h1>
              <p className="text-xs text-slate-500 sm:text-sm">IMPS / NEFT bank transfers</p>
            </div>
          </div>
          <Button variant="outline" onClick={onBack} className="shrink-0 gap-2 rounded-xl transition-all hover:scale-[1.02]">
            <MoveLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Step tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {stepBtn(1, "Account details",  <Landmark className="h-4 w-4" />)}
          {stepBtn(2, "Transfer",         <Send className="h-4 w-4" />)}
          {stepBtn(3, "Status & history", <Search className="h-4 w-4" />)}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">

          {/* ── STEP 1: Account details ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="grid gap-5 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <div className={card}>
                  <div className={cardInner}>
                    <div className="mb-5 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <h2 className="text-base font-semibold text-slate-900">Beneficiary account</h2>
                    </div>

                    <div className="space-y-4">
                      {/* Account number + IFSC */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          {lbl("Account number")}
                          <Input
                            value={acct}
                            onChange={(e) => setAcct(e.target.value)}
                            placeholder="e.g. 924020056452946"
                            className={inp}
                          />
                        </div>
                        <div className="space-y-1.5">
                          {lbl("IFSC code")}
                          <Input
                            value={ifsc}
                            onChange={(e) => handleIfscChange(e.target.value)}
                            placeholder="e.g. UTIB0000248"
                            className={inp}
                          />
                        </div>
                      </div>

                      {/* Bank name — auto-filled from IFSC or manual */}
                      <div className="space-y-1.5">
                        {lbl("Bank name")}
                        <Input
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. Axis Bank  (auto-filled from IFSC)"
                          className={inp}
                        />
                      </div>

                      {/* Account holder name */}
                      <div className="space-y-1.5">
                        {lbl("Account holder name")}
                        <Input
                          value={holderName}
                          onChange={(e) => setHolderName(e.target.value)}
                          placeholder="Enter manually or use Verify"
                          className={inp}
                        />
                      </div>

                      {/* Mobile */}
                      <div className="space-y-1.5">
                        {lbl("Mobile number")}
                        <Input
                          type="tel"
                          maxLength={10}
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                          placeholder="10-digit Indian number"
                          className={inp}
                        />
                      </div>

                      {/* Action row */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Button
                          type="button"
                          size="lg"
                          className="gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-[15px] font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.02] disabled:opacity-60"
                          onClick={onVerify}
                          disabled={verifyLoading || !acct.trim() || !ifsc.trim()}
                        >
                          {verifyLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                          Verify account
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="gap-2 rounded-xl text-violet-600 hover:bg-violet-50 hover:text-violet-700 transition-all"
                          onClick={() => setStep(2)}
                        >
                          Proceed to transfer
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>

                      {verifyMsg && (
                        <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl border px-4 py-3.5 text-sm ${
                          holderName
                            ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900"
                            : "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900"
                        }`}>
                          {holderName && (
                            <div className="mb-1 flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                              <p className="font-bold text-emerald-800">{holderName}</p>
                            </div>
                          )}
                          <p>{verifyMsg}</p>
                          {holderName && (
                            <button
                              type="button"
                              onClick={() => setStep(2)}
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                            >
                              Proceed to transfer <Send className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet + tips */}
              <div className="lg:col-span-2 space-y-4">
                {/* Wallet balance card */}
                <div className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 p-5 text-white shadow-xl shadow-emerald-500/20 relative">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-xl" aria-hidden />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-emerald-200" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-200">Wallet Balance</h3>
                      </div>
                      <button
                        type="button"
                        onClick={loadBalance}
                        className="rounded-lg p-1.5 text-emerald-200 transition-all hover:bg-white/15 hover:text-white hover:rotate-180 duration-500"
                        title="Refresh balance"
                      >
                        <RefreshCw className={`h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                    {balanceError ? (
                      <p className="mt-3 text-sm text-red-200">{balanceError}</p>
                    ) : balanceLoading && walletBalance === null ? (
                      <div className="mt-3 flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-200" />
                        <span className="text-lg text-emerald-100">Loading…</span>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 text-4xl font-extrabold tracking-tight">
                          ₹{walletBalance?.toLocaleString("en-IN") ?? "0"}
                        </p>
                        {walletFrozen && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-300">
                            <Lock className="h-3.5 w-3.5" /> Wallet frozen — contact support
                          </p>
                        )}
                      </>
                    )}
                    <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-emerald-300/80">Payouts debit this balance directly</p>
                  </div>
                </div>

                {/* How it works */}
                <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-lg shadow-violet-500/20">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-violet-200">How it works</h3>
                  <ol className="space-y-3 text-sm leading-relaxed text-violet-100">
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">1</span>Enter beneficiary account details</li>
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">2</span>Optionally verify account (free)</li>
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">3</span>Enter amount &amp; initiate IMPS/NEFT</li>
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">4</span>Track status in real time</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Transfer ─────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="mx-auto max-w-2xl">
              <div className={card}>
                <div className={cardInner}>
                  <div className="mb-5 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                      <Send className="h-4 w-4" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">Transfer details</h2>
                  </div>

                  {/* Quick summary of who we're paying */}
                  {(holderName || acct) && (
                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <p className="font-semibold text-slate-800">{holderName || "—"}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">{acct} · {ifsc}</p>
                      {bankName && <p className="text-xs text-slate-500">{bankName}</p>}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        {lbl("Amount (₹)")}
                        <Input
                          type="number"
                          min={100}
                          max={200000}
                          step="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Min ₹100 · Max ₹2,00,000"
                          className={inp}
                        />
                      </div>
                      <div className="space-y-1.5">
                        {lbl("Payment mode")}
                        <Select value={mode} onValueChange={(v) => setMode(v as "IMPS" | "NEFT")}>
                          <SelectTrigger className={inp}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IMPS">IMPS — Instant (24×7)</SelectItem>
                            <SelectItem value="NEFT">NEFT — Batch settlement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {lbl("Email (optional)")}
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="beneficiary@example.com"
                        className={inp}
                      />
                    </div>

                    <div className="space-y-1.5">
                      {lbl("Remarks (optional)")}
                      <Input
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="e.g. Salary payment"
                        className={inp}
                      />
                    </div>

                    {transferMsg && (
                      <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl border px-4 py-3.5 text-sm ${
                        lastTxnId
                          ? lastStatus === "FAILED"
                            ? "border-red-200 bg-red-50 text-red-800"
                            : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900"
                          : "border-red-200 bg-gradient-to-r from-red-50 to-rose-50 text-red-800"
                      }`}>
                        <p className="font-medium">{transferMsg}</p>
                        {lastTxnId && (
                          <div className="mt-2 flex items-center gap-2">
                            <p className="font-mono text-xs bg-emerald-100/60 px-2 py-0.5 rounded-md text-emerald-600">
                              ID: {lastTxnId}
                            </p>
                            <button
                              type="button"
                              onClick={() => { setStatusId(lastTxnId); setStep(3); }}
                              className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors underline underline-offset-2"
                            >
                              Track status →
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button
                        type="button"
                        size="lg"
                        className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-700 hover:to-indigo-700 hover:shadow-xl disabled:opacity-60"
                        onClick={onTransfer}
                        disabled={transferLoading}
                      >
                        {transferLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        Initiate transfer
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setStep(1)}
                      >
                        <MoveLeft className="mr-1.5 h-4 w-4" />
                        Edit account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Status & History ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="grid gap-5 lg:grid-cols-5">
              {/* Status lookup */}
              <div className="lg:col-span-2">
                <div className={card}>
                  <div className={cardInner}>
                    <div className="mb-4 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                        <Search className="h-4 w-4" />
                      </div>
                      <h2 className="text-base font-semibold text-slate-900">Check status</h2>
                    </div>
                    <div className="space-y-3">
                      <Input
                        placeholder="Transaction UUID"
                        value={statusId}
                        onChange={(e) => setStatusId(e.target.value)}
                        className={`${inp} font-mono`}
                      />
                      <Button
                        type="button"
                        className="w-full gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/20 hover:from-sky-700 hover:to-blue-700"
                        onClick={onCheckStatus}
                        disabled={statusLoading}
                      >
                        {statusLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Check status
                      </Button>

                      {statusError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{statusError}</div>
                      )}

                      {statusResult && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sky-900">Status</span>
                            {statusBadge(statusResult.status)}
                          </div>
                          <div className="flex items-center justify-between text-sky-800">
                            <span>Amount</span>
                            <span className="font-semibold">₹{statusResult.amount?.toLocaleString("en-IN") ?? "—"}</span>
                          </div>
                          {statusResult.charges != null && (
                            <div className="flex items-center justify-between text-sky-800">
                              <span>Charges</span>
                              <span>₹{statusResult.charges}</span>
                            </div>
                          )}
                          {statusResult.utr && (
                            <div className="flex items-center justify-between text-sky-800">
                              <span>UTR</span>
                              <span className="font-mono text-xs">{statusResult.utr}</span>
                            </div>
                          )}
                          {statusResult.account_holder_name && (
                            <div className="flex items-center justify-between text-sky-800">
                              <span>Beneficiary</span>
                              <span>{statusResult.account_holder_name}</span>
                            </div>
                          )}
                          {statusResult.payment_mode && (
                            <div className="flex items-center justify-between text-sky-800">
                              <span>Mode</span>
                              <span>{statusResult.payment_mode}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent transactions */}
              <div className="lg:col-span-3">
                <div className={card}>
                  <div className={cardInner}>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                          <RefreshCw className={`h-4 w-4 ${listLoading ? "animate-spin" : ""}`} />
                        </div>
                        <h2 className="text-base font-semibold text-slate-900">Recent payouts</h2>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 rounded-lg text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                        onClick={loadList}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>

                    {listError && (
                      <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">{listError}</div>
                    )}

                    <div className="max-h-[400px] overflow-auto rounded-xl border border-slate-200/80">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80">
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Amount</TableHead>
                            <TableHead className="hidden font-semibold md:table-cell">Mode</TableHead>
                            <TableHead className="hidden font-semibold md:table-cell">UTR</TableHead>
                            <TableHead className="text-right font-semibold">When</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {list.length === 0 && !listLoading && (
                            <TableRow>
                              <TableCell colSpan={5} className="py-12 text-center">
                                <div className="flex flex-col items-center gap-2 text-slate-500">
                                  <Send className="h-8 w-8 text-slate-300" />
                                  <p className="text-sm font-medium">No payouts yet</p>
                                  <p className="text-xs">Initiate your first transfer to see it here.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {list.map((row, i) => (
                            <TableRow
                              key={row.transaction_id}
                              className="animate-in fade-in duration-300 cursor-pointer hover:bg-slate-50"
                              style={{ animationDelay: `${i * 40}ms` }}
                              onClick={() => { setStatusId(row.transaction_id); }}
                            >
                              <TableCell>{statusBadge(row.status)}</TableCell>
                              <TableCell className="font-semibold">₹{row.amount?.toLocaleString("en-IN") ?? "—"}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  row.payment_mode === "IMPS" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                                }`}>
                                  {row.payment_mode ?? "—"}
                                </span>
                              </TableCell>
                              <TableCell className="hidden font-mono text-xs text-slate-500 md:table-cell">
                                {row.utr ?? "—"}
                              </TableCell>
                              <TableCell className="text-right text-xs text-slate-500">
                                {row.created_at ? new Date(row.created_at).toLocaleString("en-IN") : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
