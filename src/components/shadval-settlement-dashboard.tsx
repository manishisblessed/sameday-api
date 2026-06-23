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
  UserPlus,
  Trash2,
} from "lucide-react";
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
  fetchShadvalBalance,
  fetchShadvalAccounts,
  addShadvalAccount,
  deleteShadvalAccount,
  fetchShadvalCharges,
  initiateShadvalTransfer,
  getShadvalStatus,
  listShadvalTransactions,
} from "@/lib/client-api";
import type { ShadvalAccount, ShadvalTransaction } from "@/lib/types";

function statusBadge(status?: string) {
  const s = (status || "").toUpperCase();
  if (s === "SUCCESS")
    return <Badge className="border-green-200 bg-green-50 text-green-800">{status}</Badge>;
  if (s === "FAILED")
    return <Badge className="border-red-200 bg-red-50 text-red-800">{status}</Badge>;
  if (s === "PENDING")
    return <Badge className="border-amber-200 bg-amber-50 text-amber-900">{status}</Badge>;
  return <Badge variant="outline">{status || "—"}</Badge>;
}

const TOKEN_KEY = "settlement_unlock_token";

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

  if (checkingDisabled) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-slate-50 via-orange-50/30 to-amber-50/20 md:min-h-[calc(100vh-3.5rem)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(251,146,60,0.12),transparent)]" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-64 w-64 rounded-full bg-orange-300/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-20 bottom-1/4 h-56 w-56 rounded-full bg-amber-300/15 blur-3xl" aria-hidden />

      <div className="relative flex min-h-[inherit] flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-300">
          <div className="mb-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600/90">Protected</p>
            <h2 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
              Settlement-2 · SHADVAL
            </h2>
            <p className="mx-auto mt-2 max-w-[340px] text-sm leading-relaxed text-slate-600">
              This area handles IMPS/NEFT/RTGS payouts via SHADVAL Pay. Enter the access password to continue.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15)] ring-1 ring-white/60 backdrop-blur-md">
            <div className="rounded-[0.9rem] bg-gradient-to-b from-white to-slate-50/80 px-6 pb-6 pt-7 sm:px-8">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-orange-400/25 to-amber-400/20 blur-xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-500/30 ring-4 ring-white">
                    <ShieldCheck className="h-8 w-8 opacity-95" strokeWidth={1.5} />
                    <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-white bg-slate-900 text-white shadow-md">
                      <Lock className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="shadval-pw" className="text-sm font-medium text-slate-800">
                    Access password
                  </label>
                  <Input
                    id="shadval-pw"
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !loading && pw.trim() && submit()}
                    placeholder="••••••••"
                    className="h-11 rounded-xl border-slate-200 bg-white text-base shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus-visible:border-orange-400 focus-visible:ring-orange-500/25 md:text-sm"
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
                  className="h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 text-[15px] font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-700 hover:to-orange-800 disabled:opacity-60"
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

          <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
            Session unlock is stored until you close this browser tab.
          </p>
        </div>
      </div>
    </div>
  );
}

type Props = { onBack: () => void };

export function ShadvalSettlementDashboard({ onBack }: Props) {
  const [authState, setAuthState] = useState<"checking" | "locked" | "unlocked">("checking");

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    fetch("/api/payout/check-token", {
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

  // Balance
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletFrozen, setWalletFrozen] = useState(false);
  const [freezeReason, setFreezeReason] = useState<string>("");
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Accounts
  const [accounts, setAccounts] = useState<ShadvalAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  // Add Account form
  const [newAcctNumber, setNewAcctNumber] = useState("");
  const [newIfsc, setNewIfsc] = useState("");
  const [newHolderName, setNewHolderName] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactMobile, setNewContactMobile] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Transfer
  const [transferAccountId, setTransferAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferMode, setTransferMode] = useState<"IMPS" | "NEFT" | "RTGS">("IMPS");
  const [transferNarration, setTransferNarration] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMsg, setTransferMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastReferenceId, setLastReferenceId] = useState<string | null>(null);

  // Charges
  const [chargesInfo, setChargesInfo] = useState<string | null>(null);

  // Transactions
  const [transactions, setTransactions] = useState<ShadvalTransaction[]>([]);
  const [txnLoading, setTxnLoading] = useState(true);

  // Status check
  const [statusRefId, setStatusRefId] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<string | null>(null);

  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const res = await fetchShadvalBalance();
      if (res.success) {
        setWalletBalance(res.balance ?? 0);
        setWalletFrozen(res.is_frozen ?? false);
        setFreezeReason(res.freeze_reason ?? "");
      } else {
        setBalanceError(res.error?.message ?? "Could not load balance");
      }
    } catch (e) {
      setBalanceError(e instanceof Error ? e.message : String(e));
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const res = await fetchShadvalAccounts();
      if (res.success && res.accounts) {
        setAccounts(res.accounts);
      } else {
        setAccountsError(res.error?.message ?? "Could not load accounts");
      }
    } catch (e) {
      setAccountsError(e instanceof Error ? e.message : String(e));
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setTxnLoading(true);
    try {
      const res = await listShadvalTransactions(20);
      if (res.success && res.transactions) {
        setTransactions(res.transactions);
      }
    } catch {
      // silent
    } finally {
      setTxnLoading(false);
    }
  }, []);

  useEffect(() => { loadBalance(); }, [loadBalance]);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const onAddAccount = async () => {
    setAddMsg(null);
    if (!newContactEmail.trim()) {
      setAddMsg({ type: "error", text: "Contact email is required for transfers." });
      return;
    }
    setAddLoading(true);
    try {
      const res = await addShadvalAccount({
        account_number: newAcctNumber.trim(),
        ifsc_code: newIfsc.trim().toUpperCase(),
        account_holder_name: newHolderName.trim(),
        contact_name: newContactName.trim() || undefined,
        contact_email: newContactEmail.trim(),
        contact_mobile: newContactMobile.trim() || undefined,
      });
      if (res.success) {
        const verifiedStr = res.verified ? `Verified as: ${res.verified_name || "—"}` : `Status: ${res.verification_status || "PENDING"}`;
        setAddMsg({ type: "success", text: `Account added. ${verifiedStr}. Charge: ₹${res.charge_deducted ?? 4}` });
        loadAccounts();
        loadBalance();
        setNewAcctNumber("");
        setNewIfsc("");
        setNewHolderName("");
        setNewContactName("");
        setNewContactEmail("");
        setNewContactMobile("");
      } else {
        setAddMsg({ type: "error", text: res.error?.message ?? res.message ?? "Failed to add account" });
      }
    } catch (e) {
      setAddMsg({ type: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setAddLoading(false);
    }
  };

  const onDeleteAccount = async (id: string) => {
    if (!confirm("Deactivate this account? It cannot be used for transfers after.")) return;
    const res = await deleteShadvalAccount(id);
    if (res.success) {
      loadAccounts();
    } else {
      alert(res.error?.message ?? "Could not delete account");
    }
  };

  const onCheckCharges = async () => {
    const amt = Number(transferAmount);
    if (!amt || amt <= 0) { setChargesInfo("Enter a valid amount first."); return; }
    const res = await fetchShadvalCharges(amt, transferMode);
    if (res.success) {
      setChargesInfo(`Charges: ₹${res.charges ?? 0} · Total debit: ₹${res.total_debit ?? amt}`);
    } else {
      setChargesInfo(res.error?.message ?? "Could not get charges");
    }
  };

  const selectedTransferAccount = accounts.find((a) => a.id === transferAccountId);

  const onTransfer = async () => {
    setTransferMsg(null);
    if (!transferAccountId) {
      setTransferMsg({ type: "error", text: "Select an account." });
      return;
    }
    const amt = Number(transferAmount);
    if (!amt || amt <= 0) {
      setTransferMsg({ type: "error", text: "Enter a valid amount." });
      return;
    }
    const email = transferEmail.trim() || selectedTransferAccount?.contact_email || "";
    if (!email) {
      setTransferMsg({ type: "error", text: "Contact email is required. Enter it below or add it when registering the account." });
      return;
    }
    setTransferLoading(true);
    try {
      const contactName = selectedTransferAccount?.contact_name || selectedTransferAccount?.account_holder_name || undefined;
      const contactMobile = selectedTransferAccount?.contact_mobile || undefined;
      const res = await initiateShadvalTransfer({
        account_id: transferAccountId,
        amount: amt,
        mode: transferMode,
        narration: transferNarration.trim() || undefined,
        contact_name: contactName,
        contact_email: email,
        contact_mobile: contactMobile,
        contact_details: {
          name: contactName,
          email,
          mobile: contactMobile,
        },
      });
      if (res.success && res.transaction) {
        const tx = res.transaction;
        setLastReferenceId(tx.reference_id ?? null);
        setTransferMsg({
          type: "success",
          text: `${tx.status ?? "INITIATED"} · ₹${tx.amount} · Ref: ${tx.reference_id ?? "—"} · UTR: ${tx.utr ?? "pending"}`,
        });
        loadBalance();
        loadTransactions();
      } else {
        setTransferMsg({ type: "error", text: res.error?.message ?? res.message ?? "Transfer failed" });
      }
    } catch (e) {
      setTransferMsg({ type: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setTransferLoading(false);
    }
  };

  const onCheckStatus = async () => {
    const refId = statusRefId.trim() || lastReferenceId;
    if (!refId) {
      setStatusResult("Enter a reference ID or initiate a transfer first.");
      return;
    }
    setStatusLoading(true);
    setStatusResult(null);
    try {
      const res = await getShadvalStatus(refId);
      if (res.success && res.transaction) {
        const t = res.transaction;
        setStatusResult(
          `${t.status ?? "—"} · ₹${t.amount ?? "—"} · UTR: ${t.utr ?? "—"} · ${t.status_message ?? ""}`
        );
      } else {
        setStatusResult(res.error?.message ?? "Status lookup failed.");
      }
    } catch (e) {
      setStatusResult(e instanceof Error ? e.message : String(e));
    } finally {
      setStatusLoading(false);
    }
  };

  const [step, setStep] = useState<1 | 2 | 3>(1);

  if (authState === "checking") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
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
          ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/25 scale-[1.02]"
          : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/80 hover:ring-orange-300 hover:text-orange-700 hover:shadow-md"
      }`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
        step === n ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-700"
      }`}>
        {icon}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const fieldLabel = (text: string) => (
    <label className="text-[13px] font-semibold text-slate-700">{text}</label>
  );

  const styledInput = "h-11 rounded-xl border-slate-200 bg-white text-sm shadow-inner shadow-slate-900/[0.03] placeholder:text-slate-400 focus-visible:border-orange-400 focus-visible:ring-orange-500/20 transition-colors";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50/20 to-amber-50/30">
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-orange-300/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-24 bottom-20 h-80 w-80 rounded-full bg-amber-300/15 blur-3xl" aria-hidden />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-400 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/25">
              <Landmark className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Settlement-2 · SHADVAL</h1>
              <p className="text-xs text-slate-500 sm:text-sm">IMPS / NEFT / RTGS via SHADVAL Pay</p>
            </div>
          </div>
          <Button variant="outline" onClick={onBack} className="shrink-0 gap-2 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
            <MoveLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Step Tabs */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6 flex flex-wrap items-center gap-2">
          {stepLabel(1, "Accounts & Verify", <UserPlus className="h-4 w-4" />)}
          {stepLabel(2, "Transfer", <Send className="h-4 w-4" />)}
          {stepLabel(3, "Status & History", <Search className="h-4 w-4" />)}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
          {/* STEP 1: Accounts */}
          {step === 1 && (
            <div className="grid gap-5 lg:grid-cols-5">
              <div className="lg:col-span-3 space-y-5">
                {/* Add Account */}
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-lg shadow-slate-900/[0.04] ring-1 ring-white/60 backdrop-blur">
                  <div className="rounded-[0.85rem] bg-gradient-to-b from-white to-slate-50/50 p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                        <UserPlus className="h-4 w-4" />
                      </div>
                      <h2 className="text-base font-semibold text-slate-900">Add &amp; Verify Account</h2>
                      <span className="ml-auto text-[11px] text-slate-500">₹4 verification charge</span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          {fieldLabel("Account number *")}
                          <Input value={newAcctNumber} onChange={(e) => setNewAcctNumber(e.target.value)} placeholder="e.g. 50100104420821" className={styledInput} />
                        </div>
                        <div className="space-y-2">
                          {fieldLabel("IFSC code *")}
                          <Input value={newIfsc} onChange={(e) => setNewIfsc(e.target.value.toUpperCase())} placeholder="e.g. HDFC0003756" className={styledInput} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {fieldLabel("Account holder name *")}
                        <Input value={newHolderName} onChange={(e) => setNewHolderName(e.target.value)} placeholder="Full name as per bank" className={styledInput} />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-2">
                          {fieldLabel("Contact name")}
                          <Input value={newContactName} onChange={(e) => setNewContactName(e.target.value)} placeholder="Optional" className={styledInput} />
                        </div>
                        <div className="space-y-2">
                          {fieldLabel("Contact email *")}
                          <Input type="email" value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} placeholder="Required for transfers" className={styledInput} />
                        </div>
                        <div className="space-y-2">
                          {fieldLabel("Contact mobile")}
                          <Input value={newContactMobile} onChange={(e) => setNewContactMobile(e.target.value)} placeholder="10 digits" className={styledInput} />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Button
                          type="button"
                          size="lg"
                          className="gap-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-700 hover:to-amber-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                          onClick={onAddAccount}
                          disabled={addLoading || !newAcctNumber.trim() || !newIfsc.trim() || !newHolderName.trim() || !newContactEmail.trim()}
                        >
                          {addLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                          Add &amp; Verify
                        </Button>
                      </div>

                      {addMsg && (
                        <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl border px-4 py-3.5 text-sm ${
                          addMsg.type === "success"
                            ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900"
                            : "border-red-200 bg-gradient-to-r from-red-50 to-rose-50 text-red-800"
                        }`}>
                          <p className="font-medium">{addMsg.text}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Existing Accounts */}
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-lg shadow-slate-900/[0.04] ring-1 ring-white/60 backdrop-blur">
                  <div className="rounded-[0.85rem] bg-gradient-to-b from-white to-slate-50/50 p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <h2 className="text-base font-semibold text-slate-900">Verified Accounts</h2>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="gap-1.5 rounded-lg text-orange-600 hover:bg-orange-50 hover:text-orange-700" onClick={() => loadAccounts()}>
                        <RefreshCw className={`h-3.5 w-3.5 ${accountsLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>

                    {accountsError && (
                      <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">{accountsError}</div>
                    )}

                    <div className="max-h-[300px] overflow-auto rounded-xl border border-slate-200/80">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80">
                            <TableHead className="font-semibold">Account</TableHead>
                            <TableHead className="font-semibold">IFSC</TableHead>
                            <TableHead className="font-semibold">Holder</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accounts.length === 0 && !accountsLoading && (
                            <TableRow>
                              <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                                No verified accounts yet. Add one above.
                              </TableCell>
                            </TableRow>
                          )}
                          {accounts.map((acct) => (
                            <TableRow key={acct.id}>
                              <TableCell className="font-mono text-xs">{acct.account_number}</TableCell>
                              <TableCell className="text-xs">{acct.ifsc_code}</TableCell>
                              <TableCell className="text-sm font-medium">{acct.verified_name || acct.account_holder_name}</TableCell>
                              <TableCell>
                                {acct.is_verified ? (
                                  <Badge className="border-green-200 bg-green-50 text-green-800">Verified</Badge>
                                ) : (
                                  <Badge className="border-amber-200 bg-amber-50 text-amber-900">Pending</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <button
                                  type="button"
                                  onClick={() => onDeleteAccount(acct.id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  title="Deactivate account"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="lg:col-span-2 space-y-4">
                {/* Wallet Balance */}
                <div className="overflow-hidden rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-600 via-orange-600 to-amber-700 p-5 text-white shadow-xl shadow-orange-500/20 relative">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-xl" aria-hidden />
                  <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-amber-400/15 blur-lg" aria-hidden />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-orange-200" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-200">Wallet Balance</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => loadBalance()}
                        className="rounded-lg p-1.5 text-orange-200 transition-all hover:bg-white/15 hover:text-white hover:rotate-180 duration-500"
                        title="Refresh balance"
                      >
                        <RefreshCw className={`h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                    {balanceError ? (
                      <div className="mt-3">
                        <p className="text-sm text-red-200">{balanceError}</p>
                        <button type="button" onClick={() => loadBalance()} className="mt-2 text-xs font-medium text-orange-200 underline underline-offset-2 hover:text-white transition-colors">
                          Tap to retry
                        </button>
                      </div>
                    ) : balanceLoading && walletBalance === null ? (
                      <div className="mt-3 flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-orange-200" />
                        <span className="text-lg text-orange-100">Loading…</span>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 text-4xl font-extrabold tracking-tight">
                          ₹{walletBalance?.toLocaleString("en-IN") ?? "0"}
                        </p>
                        {walletFrozen && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-300">
                            <Lock className="h-3.5 w-3.5" /> Wallet frozen{freezeReason ? ` — ${freezeReason}` : ""}
                          </p>
                        )}
                      </>
                    )}
                    <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-orange-300/80">Payouts debit this balance directly</p>
                  </div>
                </div>

                {/* How it works */}
                <div className="rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-600 to-amber-700 p-5 text-white shadow-lg shadow-orange-500/20">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-orange-200">How it works</h3>
                  <ol className="space-y-3 text-sm leading-relaxed text-orange-100">
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">1</span> Check wallet balance</li>
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">2</span> Add &amp; verify account (₹4 penny-drop)</li>
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">3</span> Choose account &amp; initiate transfer</li>
                    <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">4</span> Track status in real time</li>
                  </ol>
                </div>

                {accounts.length > 0 && (
                  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
                    <p className="mb-1 text-xs font-medium text-slate-500">Verified accounts</p>
                    <p className="text-3xl font-bold text-orange-700">{accounts.filter(a => a.is_verified).length}</p>
                    <p className="text-xs text-slate-500">Ready for transfers</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Transfer */}
          {step === 2 && (
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-lg shadow-slate-900/[0.04] ring-1 ring-white/60 backdrop-blur">
                <div className="rounded-[0.85rem] bg-gradient-to-b from-white to-slate-50/50 p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <Send className="h-4 w-4" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">Initiate Transfer</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      {fieldLabel("Select verified account *")}
                      <Select value={transferAccountId} onValueChange={(v) => setTransferAccountId(v ?? "")}>
                        <SelectTrigger className={styledInput}>
                          <SelectValue placeholder={accountsLoading ? "Loading accounts…" : "Select account"} />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.filter(a => a.is_verified).map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              <span className="font-medium">{a.verified_name || a.account_holder_name}</span>
                              <span className="text-muted-foreground"> · {a.account_number} · {a.ifsc_code}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        {fieldLabel("Amount (₹) *")}
                        <Input type="number" min={1} step="1" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="e.g. 5000" className={styledInput} />
                      </div>
                      <div className="space-y-2">
                        {fieldLabel("Transfer mode")}
                        <Select value={transferMode} onValueChange={(v) => setTransferMode(v as "IMPS" | "NEFT" | "RTGS")}>
                          <SelectTrigger className={styledInput}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IMPS">IMPS (Instant)</SelectItem>
                            <SelectItem value="NEFT">NEFT (Batch)</SelectItem>
                            <SelectItem value="RTGS">RTGS (High Value)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {fieldLabel("Narration (optional)")}
                      <Input value={transferNarration} onChange={(e) => setTransferNarration(e.target.value)} placeholder="Payment note" className={styledInput} />
                    </div>

                    <div className="space-y-2">
                      {fieldLabel("Contact email *")}
                      <Input
                        type="email"
                        value={transferEmail || selectedTransferAccount?.contact_email || ""}
                        onChange={(e) => setTransferEmail(e.target.value)}
                        placeholder="required by API"
                        className={styledInput}
                      />
                      {selectedTransferAccount?.contact_email && !transferEmail && (
                        <p className="text-xs text-slate-500">Auto-filled from account</p>
                      )}
                    </div>

                    {chargesInfo && (
                      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-900">
                        {chargesInfo}
                      </div>
                    )}

                    {transferMsg && (
                      <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl border px-4 py-3.5 text-sm ${
                        transferMsg.type === "success"
                          ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900"
                          : "border-red-200 bg-gradient-to-r from-red-50 to-rose-50 text-red-800"
                      }`}>
                        <p className="font-medium">{transferMsg.text}</p>
                        {lastReferenceId && transferMsg.type === "success" && (
                          <div className="mt-2 flex items-center gap-2">
                            <p className="font-mono text-xs text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-md">Ref: {lastReferenceId}</p>
                            <button
                              type="button"
                              onClick={() => { setStatusRefId(lastReferenceId); setStep(3); }}
                              className="text-xs font-semibold text-orange-600 hover:text-orange-800 transition-colors underline underline-offset-2"
                            >
                              Track status
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button
                        type="button"
                        size="lg"
                        className="gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-700 hover:to-amber-700 hover:shadow-xl disabled:opacity-60"
                        onClick={onTransfer}
                        disabled={transferLoading}
                      >
                        {transferLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        Initiate transfer
                      </Button>
                      <Button type="button" variant="outline" className="rounded-xl gap-1.5" onClick={onCheckCharges}>
                        Check charges
                      </Button>
                      <Button type="button" variant="outline" className="rounded-xl" onClick={() => setStep(1)}>
                        <MoveLeft className="mr-1.5 h-4 w-4" />
                        Back to accounts
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Status & History */}
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
                        placeholder="Reference ID"
                        value={statusRefId}
                        onChange={(e) => setStatusRefId(e.target.value)}
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

                      {statusResult && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                          {statusResult}
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                          <RefreshCw className={`h-4 w-4 ${txnLoading ? "animate-spin" : ""}`} />
                        </div>
                        <h2 className="text-base font-semibold text-slate-900">Recent transactions</h2>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="gap-1.5 rounded-lg text-orange-600 hover:bg-orange-50 hover:text-orange-700" onClick={() => loadTransactions()}>
                        <RefreshCw className={`h-3.5 w-3.5 ${txnLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>

                    <div className="max-h-[400px] overflow-auto rounded-xl border border-slate-200/80">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80">
                            <TableHead className="w-[100px] font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Amount</TableHead>
                            <TableHead className="hidden font-semibold md:table-cell">Mode</TableHead>
                            <TableHead className="hidden font-semibold lg:table-cell">UTR</TableHead>
                            <TableHead className="text-right font-semibold">When</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.length === 0 && !txnLoading && (
                            <TableRow>
                              <TableCell colSpan={5} className="py-12 text-center">
                                <div className="flex flex-col items-center gap-2 text-slate-500">
                                  <Send className="h-8 w-8 text-slate-300" />
                                  <p className="text-sm font-medium">No transactions yet</p>
                                  <p className="text-xs">Initiate your first transfer to see it here.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {transactions.map((row, i) => (
                            <TableRow key={row.reference_id || row.id || i} className="animate-in fade-in duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                              <TableCell>{statusBadge(row.status)}</TableCell>
                              <TableCell className="font-semibold">₹{row.amount?.toLocaleString("en-IN") ?? "—"}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  row.mode === "IMPS"
                                    ? "bg-blue-50 text-blue-700"
                                    : row.mode === "RTGS"
                                    ? "bg-purple-50 text-purple-700"
                                    : "bg-slate-50 text-slate-700"
                                }`}>
                                  {row.mode ?? "—"}
                                </span>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell font-mono text-xs text-slate-600">
                                {row.utr || "—"}
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
