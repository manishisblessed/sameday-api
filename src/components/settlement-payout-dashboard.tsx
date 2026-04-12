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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  fetchPayoutBanks,
  verifyPayoutAccount,
  initiatePayoutTransfer,
  getPayoutStatus,
  listRecentPayouts,
} from "@/lib/client-api";
import type { PayoutBank, PayoutListItem } from "@/lib/types";

function payoutStatusBadge(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "success" || s === "completed")
    return <Badge className="border-green-200 bg-green-50 text-green-800">{status || "—"}</Badge>;
  if (s === "failed" || s === "failure")
    return <Badge className="border-red-200 bg-red-50 text-red-800">{status || "—"}</Badge>;
  if (s === "processing" || s === "pending")
    return <Badge className="border-amber-200 bg-amber-50 text-amber-900">{status || "—"}</Badge>;
  return <Badge variant="outline">{status || "—"}</Badge>;
}

const TOKEN_KEY = "settlement_unlock_token";

function PasswordGate({ onUnlock, onBack }: { onUnlock: () => void; onBack: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingDisabled, setCheckingDisabled] = useState(true);

  // On mount, check if password gate is disabled
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
      if (data.success && data.token) {
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

  // Show loading while checking if password is disabled
  if (checkingDisabled) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-slate-50 via-violet-50/30 to-emerald-50/20 md:min-h-[calc(100vh-3.5rem)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(139,92,246,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/3 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-1/4 h-56 w-56 rounded-full bg-emerald-300/15 blur-3xl"
        aria-hidden
      />

      <div className="relative flex min-h-[inherit] flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-300">
          <div className="mb-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600/90">Protected</p>
            <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
              Settlement &amp; payout
            </h2>
            <p className="mx-auto mt-2 max-w-[340px] text-sm leading-relaxed text-slate-600">
              This area handles IMPS/NEFT payouts. Enter the access password to continue.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15)] ring-1 ring-white/60 backdrop-blur-md">
            <div className="rounded-[0.9rem] bg-gradient-to-b from-white to-slate-50/80 px-6 pb-6 pt-7 sm:px-8">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-violet-400/25 to-emerald-400/20 blur-xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-500/30 ring-4 ring-white">
                    <ShieldCheck className="h-8 w-8 opacity-95" strokeWidth={1.5} />
                    <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-white bg-slate-900 text-white shadow-md">
                      <Lock className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="settlement-pw" className="text-sm font-medium text-slate-800">
                    Access password
                  </label>
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
                  className="h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-[15px] font-semibold text-white shadow-md shadow-violet-500/25 transition hover:from-violet-700 hover:to-violet-800 disabled:opacity-60"
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

type Props = { onBack: () => void };

export function SettlementPayoutDashboard({ onBack }: Props) {
  const [authState, setAuthState] = useState<"checking" | "locked" | "unlocked">("checking");

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    
    // Check if password gate is enabled or if we have a valid token
    fetch("/api/payout/check-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token || "" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.passwordDisabled) {
          // Password gate is disabled (SETTLEMENT_PASSWORD not set)
          setAuthState("unlocked");
        } else if (d.valid) {
          setAuthState("unlocked");
        } else {
          setAuthState("locked");
        }
      })
      .catch(() => setAuthState("locked"));
  }, []);

  // Partner wallet balance (v3.0)
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletFrozen, setWalletFrozen] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [banks, setBanks] = useState<PayoutBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState<string | null>(null);

  const [list, setList] = useState<PayoutListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [bankSearch, setBankSearch] = useState("");

  const [acct, setAcct] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankIdStr, setBankIdStr] = useState<string>("");

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const [holderName, setHolderName] = useState("");

  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"IMPS" | "NEFT">("IMPS");
  const [benMobile, setBenMobile] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderMobile, setSenderMobile] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [remarks, setRemarks] = useState("");

  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMsg, setTransferMsg] = useState<string | null>(null);
  const [lastTxnId, setLastTxnId] = useState<string | null>(null);

  const [statusId, setStatusId] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusSnapshot, setStatusSnapshot] = useState<string | null>(null);

  // Load wallet balance on mount (v3.0)
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

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await listRecentPayouts();
      if (res.success && res.transactions) setList(res.transactions);
      else setListError(res.error?.message ?? "Could not load payouts");
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBanksLoading(true);
      setBanksError(null);
      try {
        const res = await fetchPayoutBanks();
        if (cancelled) return;
        if (res.success && res.banks) setBanks(res.banks);
        else setBanksError(res.error?.message ?? "Could not load banks");
      } catch (e) {
        if (!cancelled) setBanksError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setBanksLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const searchBanks = () => {
    void (async () => {
      setBanksLoading(true);
      setBanksError(null);
      try {
        const res = await fetchPayoutBanks(bankSearch.trim() ? { search: bankSearch.trim() } : undefined);
        if (res.success && res.banks) setBanks(res.banks);
        else setBanksError(res.error?.message ?? "Could not load banks");
      } catch (e) {
        setBanksError(e instanceof Error ? e.message : String(e));
      } finally {
        setBanksLoading(false);
      }
    })();
  };

  const selectedBank = banks.find((b) => String(b.id) === bankIdStr);

  const onVerify = async () => {
    setVerifyMsg(null);
    setVerifyLoading(true);
    try {
      const bankId = bankIdStr ? Number(bankIdStr) : undefined;
      const res = await verifyPayoutAccount({
        accountNumber: acct.trim(),
        ifscCode: ifsc.trim().toUpperCase(),
        bankName: bankName.trim() || selectedBank?.name,
        bankId: Number.isFinite(bankId) ? bankId : undefined,
      });
      if (res.success && res.is_valid && res.account_holder_name) {
        setHolderName(res.account_holder_name);
        if (res.bank_name) setBankName(res.bank_name);
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

  const onTransfer = async () => {
    setTransferMsg(null);
    const bankId = Number(bankIdStr);
    const amt = Number(amount);
    if (!bankIdStr || !Number.isFinite(bankId)) {
      setTransferMsg("Select a bank from the list.");
      return;
    }
    if (!holderName.trim()) {
      setTransferMsg("Enter beneficiary name (or verify the account first).");
      return;
    }
    const bn = (bankName.trim() || selectedBank?.name || "").trim();
    if (!bn) {
      setTransferMsg("Select a bank or enter bank name.");
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setTransferMsg("Enter a valid amount in rupees.");
      return;
    }
    if (!senderName.trim()) {
      setTransferMsg("Sender name is required.");
      return;
    }
    if (benMobile.trim().length !== 10 || senderMobile.trim().length !== 10) {
      setTransferMsg("Beneficiary and sender mobile must be 10 digits.");
      return;
    }
    const modeOk = mode === "IMPS" ? selectedBank?.imps !== false : selectedBank?.neft !== false;
    if (selectedBank && !modeOk) {
      setTransferMsg(`This bank may not support ${mode}. Pick another mode or bank.`);
      return;
    }

    setTransferLoading(true);
    try {
      const res = await initiatePayoutTransfer({
        accountNumber: acct.trim(),
        ifscCode: ifsc.trim().toUpperCase(),
        accountHolderName: holderName.trim(),
        amount: amt,
        transferMode: mode,
        bankId,
        bankName: bn,
        beneficiaryMobile: benMobile.trim(),
        senderName: senderName.trim(),
        senderMobile: senderMobile.trim(),
        senderEmail: senderEmail.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      if (res.success && res.transaction_id) {
        setLastTxnId(res.transaction_id);
        setTransferMsg(
          res.message ??
            `Initiated · ${res.status ?? "PROCESSING"} · Debit ₹${res.total_debited ?? amt + (res.charges ?? 0)}`
        );
        loadList();
        loadBalance();
      } else {
        const extra =
          res.wait_seconds != null ? ` Wait ${res.wait_seconds}s before retry.` : "";
        setTransferMsg((res.error?.message ?? "Transfer failed") + extra);
      }
    } catch (e) {
      setTransferMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setTransferLoading(false);
    }
  };

  const onCheckStatus = async () => {
    const id = statusId.trim() || lastTxnId;
    if (!id) {
      setStatusSnapshot("Enter a transaction ID or initiate a transfer first.");
      return;
    }
    setStatusLoading(true);
    setStatusSnapshot(null);
    try {
      const res = await getPayoutStatus({ transactionId: id });
      if (res.success && res.transaction) {
        const t = res.transaction;
        setStatusSnapshot(
          `${t.status ?? "—"} · ₹${t.amount ?? "—"} · ${t.bank_name ?? ""} · ${t.provider_txn_id ?? t.rrn ?? ""}`
        );
      } else {
        setStatusSnapshot(res.error?.message ?? "Status lookup failed.");
      }
    } catch (e) {
      setStatusSnapshot(e instanceof Error ? e.message : String(e));
    } finally {
      setStatusLoading(false);
    }
  };

  const [step, setStep] = useState<1 | 2 | 3>(1);

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

  const stepLabel = (n: number, label: string, icon: React.ReactNode) => (
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
      }`}>
        {icon}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const fieldLabel = (text: string) => (
    <label className="text-[13px] font-semibold text-slate-700">{text}</label>
  );

  const styledInput = "h-11 rounded-xl border-slate-200 bg-white text-sm shadow-inner shadow-slate-900/[0.03] placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-violet-500/20 transition-colors";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-slate-50 via-violet-50/20 to-indigo-50/30">
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-violet-300/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-24 bottom-20 h-80 w-80 rounded-full bg-indigo-300/15 blur-3xl" aria-hidden />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-400 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
              <Landmark className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Settlement &amp; Payout</h1>
              <p className="text-xs text-slate-500 sm:text-sm">IMPS / NEFT bank transfers</p>
            </div>
          </div>
          <Button variant="outline" onClick={onBack} className="shrink-0 gap-2 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
            <MoveLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6 flex flex-wrap items-center gap-2">
          {stepLabel(1, "Bank & verify", <Landmark className="h-4 w-4" />)}
          {stepLabel(2, "Transfer details", <Send className="h-4 w-4" />)}
          {stepLabel(3, "Status & history", <Search className="h-4 w-4" />)}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
          {step === 1 && (
            <div className="grid gap-5 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-lg shadow-slate-900/[0.04] ring-1 ring-white/60 backdrop-blur">
                  <div className="rounded-[0.85rem] bg-gradient-to-b from-white to-slate-50/50 p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <h2 className="text-base font-semibold text-slate-900">Select bank &amp; verify account</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        {fieldLabel("Search bank")}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type bank name or IFSC…"
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && searchBanks()}
                            className={`${styledInput} flex-1`}
                          />
                          <Button type="button" className="h-11 gap-1.5 rounded-xl bg-violet-600 px-4 hover:bg-violet-700" onClick={() => searchBanks()}>
                            {banksLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {fieldLabel("Bank")}
                        <Select
                          value={bankIdStr}
                          onValueChange={(v) => {
                            const id = v ?? "";
                            setBankIdStr(id);
                            const b = banks.find((x) => String(x.id) === id);
                            if (b) setBankName(b.name);
                          }}
                        >
                          <SelectTrigger className={styledInput}>
                            <SelectValue placeholder={banksLoading ? "Loading…" : `Select from ${banks.length} banks`} />
                          </SelectTrigger>
                          <SelectContent>
                            {banks.map((b) => {
                              const label = b.name?.trim() || `Bank #${b.id}`;
                              const caps = [!b.imps ? "no IMPS" : null, !b.neft ? "no NEFT" : null].filter(Boolean).join(" · ");
                              return (
                                <SelectItem key={b.id} value={String(b.id)}>
                                  <span className="font-medium">{label}</span>
                                  {caps ? <span className="text-muted-foreground"> · {caps}</span> : null}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {banksError && <p className="text-xs font-medium text-red-600">{banksError}</p>}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          {fieldLabel("Account number")}
                          <Input value={acct} onChange={(e) => setAcct(e.target.value)} placeholder="Beneficiary account" className={styledInput} />
                        </div>
                        <div className="space-y-2">
                          {fieldLabel("IFSC code")}
                          <Input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} placeholder="e.g. HDFC0001234" className={styledInput} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {fieldLabel("Bank name (optional)")}
                        <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder={selectedBank?.name ?? "Auto-filled on bank selection"} className={styledInput} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Button
                          type="button"
                          className="gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700"
                          onClick={onVerify}
                          disabled={verifyLoading || !acct.trim() || !ifsc.trim()}
                        >
                          {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                          Verify account
                        </Button>
                        <Button type="button" variant="outline" className="gap-2 rounded-xl" onClick={() => setStep(2)}>
                          Skip to transfer
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {verifyMsg && (
                        <div className={`animate-in fade-in slide-in-from-bottom-2 rounded-xl border px-4 py-3 text-sm ${
                          holderName
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border-amber-200 bg-amber-50 text-amber-900"
                        }`}>
                          {holderName && <p className="mb-0.5 font-semibold">{holderName}</p>}
                          <p>{verifyMsg}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                {/* Wallet balance card (v3.0) */}
                <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-lg shadow-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Wallet Balance</h3>
                    <button
                      type="button"
                      onClick={() => loadBalance()}
                      className="rounded-lg p-1.5 text-emerald-200 transition hover:bg-white/10 hover:text-white"
                      title="Refresh balance"
                    >
                      <RefreshCw className={`h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  {balanceError ? (
                    <p className="mt-2 text-sm text-red-200">{balanceError}</p>
                  ) : balanceLoading && walletBalance === null ? (
                    <p className="mt-2 text-2xl font-bold text-emerald-100">Loading…</p>
                  ) : (
                    <>
                      <p className="mt-1 text-3xl font-bold">
                        ₹{walletBalance?.toLocaleString("en-IN") ?? "0"}
                      </p>
                      {walletFrozen && (
                        <p className="mt-1 text-xs font-medium text-amber-300">Wallet frozen — contact support</p>
                      )}
                    </>
                  )}
                  <p className="mt-2 text-xs text-emerald-200">Payouts debit this balance directly</p>
                </div>

                <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-lg shadow-violet-500/20">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-violet-200">How it works</h3>
                  <ol className="space-y-3 text-sm leading-relaxed text-violet-100">
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">1</span> Check your wallet balance</li>
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">2</span> Select bank &amp; enter account details</li>
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">3</span> Verify beneficiary (optional, free)</li>
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">4</span> Enter amount &amp; initiate IMPS/NEFT</li>
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">5</span> Track status in real time</li>
                  </ol>
                </div>

                {banks.length > 0 && (
                  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
                    <p className="mb-1 text-xs font-medium text-slate-500">Banks loaded</p>
                    <p className="text-3xl font-bold text-violet-700">{banks.length}</p>
                    <p className="text-xs text-slate-500">IMPS &amp; NEFT supported</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-lg shadow-slate-900/[0.04] ring-1 ring-white/60 backdrop-blur">
                <div className="rounded-[0.85rem] bg-gradient-to-b from-white to-slate-50/50 p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                      <Send className="h-4 w-4" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">Transfer details</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      {fieldLabel("Beneficiary name")}
                      <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="From verification or type manually" className={styledInput} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        {fieldLabel("Amount (₹)")}
                        <Input type="number" min={1} step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000" className={styledInput} />
                      </div>
                      <div className="space-y-2">
                        {fieldLabel("Transfer mode")}
                        <Select value={mode} onValueChange={(v) => setMode(v as "IMPS" | "NEFT")}>
                          <SelectTrigger className={styledInput}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IMPS">IMPS (Instant)</SelectItem>
                            <SelectItem value="NEFT">NEFT (Batch)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        {fieldLabel("Beneficiary mobile")}
                        <Input value={benMobile} onChange={(e) => setBenMobile(e.target.value)} placeholder="10-digit number" className={styledInput} />
                      </div>
                      <div className="space-y-2">
                        {fieldLabel("Sender name")}
                        <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your name / business" className={styledInput} />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        {fieldLabel("Sender mobile")}
                        <Input value={senderMobile} onChange={(e) => setSenderMobile(e.target.value)} placeholder="10-digit number" className={styledInput} />
                      </div>
                      <div className="space-y-2">
                        {fieldLabel("Sender email (optional)")}
                        <Input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="email@example.com" className={styledInput} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {fieldLabel("Remarks (optional)")}
                      <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Payment note" className={styledInput} />
                    </div>

                    {transferMsg && (
                      <div className={`animate-in fade-in slide-in-from-bottom-2 rounded-xl border px-4 py-3 text-sm ${
                        lastTxnId
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-red-200 bg-red-50 text-red-800"
                      }`}>
                        <p>{transferMsg}</p>
                        {lastTxnId && <p className="mt-1 font-mono text-xs text-emerald-700">ID: {lastTxnId}</p>}
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
                      <Button type="button" variant="outline" className="rounded-xl" onClick={() => setStep(1)}>
                        <MoveLeft className="mr-1.5 h-4 w-4" />
                        Back to bank
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-5 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-lg shadow-slate-900/[0.04] ring-1 ring-white/60 backdrop-blur">
                  <div className="rounded-[0.85rem] bg-gradient-to-b from-white to-slate-50/50 p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-2.5">
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
                        className={`${styledInput} font-mono`}
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

                      {statusSnapshot && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                          {statusSnapshot}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-lg shadow-slate-900/[0.04] ring-1 ring-white/60 backdrop-blur">
                  <div className="rounded-[0.85rem] bg-gradient-to-b from-white to-slate-50/50 p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                          <RefreshCw className={`h-4 w-4 ${listLoading ? "animate-spin" : ""}`} />
                        </div>
                        <h2 className="text-base font-semibold text-slate-900">Recent payouts</h2>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="gap-1.5 rounded-lg text-violet-600 hover:bg-violet-50 hover:text-violet-700" onClick={() => loadList()}>
                        <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>

                    {listError && (
                      <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
                        {listError}
                      </div>
                    )}

                    <div className="max-h-[400px] overflow-auto rounded-xl border border-slate-200/80">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80">
                            <TableHead className="w-[100px] font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Amount</TableHead>
                            <TableHead className="hidden font-semibold md:table-cell">Mode</TableHead>
                            <TableHead className="text-right font-semibold">When</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {list.length === 0 && !listLoading && (
                            <TableRow>
                              <TableCell colSpan={4} className="py-12 text-center">
                                <div className="flex flex-col items-center gap-2 text-slate-500">
                                  <Send className="h-8 w-8 text-slate-300" />
                                  <p className="text-sm font-medium">No payouts yet</p>
                                  <p className="text-xs">Initiate your first transfer to see it here.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {list.map((row, i) => (
                            <TableRow key={row.id} className="animate-in fade-in duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                              <TableCell>{payoutStatusBadge(row.status)}</TableCell>
                              <TableCell className="font-semibold">₹{row.amount?.toLocaleString("en-IN") ?? "—"}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  row.transfer_mode === "IMPS"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-purple-50 text-purple-700"
                                }`}>
                                  {row.transfer_mode ?? "—"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-xs text-slate-500">
                                {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
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
