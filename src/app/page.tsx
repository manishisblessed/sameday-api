"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import Image from "next/image";
import {
  IndianRupee,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  HardDrive,
  WalletCards,
  Landmark,
  HandCoins,
  Fingerprint,
  Smartphone,
  Layers,
  MoveLeft,
  ChevronRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { fetchTransactions } from "@/lib/client-api";
import type { Transaction, TransactionResponse } from "@/lib/types";
import { SettlementPayoutDashboard } from "@/components/settlement-payout-dashboard";

const PIE_COLORS = ["#16a34a", "#ea580c", "#2563eb", "#9333ea", "#dc2626", "#ca8a04"];

type ApiKey =
  | "pos-transaction-api"
  | "bbps"
  | "settlement"
  | "dmt"
  | "aeps"
  | "recharges";

type ApiOption = {
  key: ApiKey;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Visual accent for card orb + icon chip */
  accent: {
    orb: string;
    chip: string;
    corner: string;
  };
};

const API_OPTIONS: ApiOption[] = [
  {
    key: "pos-transaction-api",
    label: "POS Transaction API",
    description: "Transaction volume, amount and payment mode analytics.",
    icon: WalletCards,
    accent: {
      orb: "bg-emerald-400/35",
      chip: "bg-emerald-500/[0.13] text-emerald-800 ring-1 ring-emerald-500/25 shadow-inner shadow-emerald-900/5",
      corner: "from-emerald-500/20 to-teal-500/5",
    },
  },
  {
    key: "bbps",
    label: "BBPS",
    description: "Bill payments and service-wise success metrics.",
    icon: Landmark,
    accent: {
      orb: "bg-sky-400/35",
      chip: "bg-sky-500/[0.13] text-sky-900 ring-1 ring-sky-500/25 shadow-inner shadow-sky-900/5",
      corner: "from-sky-500/20 to-indigo-500/5",
    },
  },
  {
    key: "settlement",
    label: "Settlement",
    description: "Settlement cycle tracking and payout reconciliation.",
    icon: Layers,
    accent: {
      orb: "bg-violet-400/35",
      chip: "bg-violet-500/[0.13] text-violet-900 ring-1 ring-violet-500/25 shadow-inner shadow-violet-900/5",
      corner: "from-violet-500/20 to-fuchsia-500/5",
    },
  },
  {
    key: "dmt",
    label: "DMT",
    description: "Money transfer throughput and status trend overview.",
    icon: HandCoins,
    accent: {
      orb: "bg-amber-400/40",
      chip: "bg-amber-500/[0.14] text-amber-950 ring-1 ring-amber-500/30 shadow-inner shadow-amber-900/5",
      corner: "from-amber-500/25 to-orange-500/5",
    },
  },
  {
    key: "aeps",
    label: "AEPS",
    description: "AEPS transaction and biometric auth performance.",
    icon: Fingerprint,
    accent: {
      orb: "bg-rose-400/35",
      chip: "bg-rose-500/[0.13] text-rose-900 ring-1 ring-rose-500/25 shadow-inner shadow-rose-900/5",
      corner: "from-rose-500/20 to-pink-500/5",
    },
  },
  {
    key: "recharges",
    label: "Recharges",
    description: "Operator-wise recharge volume and success ratio.",
    icon: Smartphone,
    accent: {
      orb: "bg-cyan-400/35",
      chip: "bg-cyan-500/[0.13] text-cyan-950 ring-1 ring-cyan-500/25 shadow-inner shadow-cyan-900/5",
      corner: "from-cyan-500/20 to-emerald-500/5",
    },
  },
];

function groupByDate(txns: Transaction[]) {
  const map = new Map<string, { date: string; count: number; amount: number }>();
  for (const t of txns) {
    const d = format(new Date(t.txn_time), "MMM dd");
    const entry = map.get(d) ?? { date: d, count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += parseFloat(t.amount) || 0;
    map.set(d, entry);
  }
  return Array.from(map.values());
}

function groupByPaymentMode(txns: Transaction[]) {
  const map = new Map<string, number>();
  for (const t of txns) {
    const mode = t.payment_mode || "OTHER";
    map.set(mode, (map.get(mode) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedApi, setSelectedApi] = useState<ApiKey | null>(null);
  const [data, setData] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadPosDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const res = await fetchTransactions({
        date_from: startOfDay(subDays(now, 89)).toISOString(),
        date_to: endOfDay(now).toISOString(),
        page: 1,
        page_size: 100,
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const api = searchParams.get("api");
    const isValidSelection = API_OPTIONS.some((option) => option.key === api);
    setSelectedApi(isValidSelection ? (api as ApiKey) : null);
  }, [searchParams]);

  useEffect(() => {
    if (selectedApi === "pos-transaction-api") {
      loadPosDashboard();
    }
  }, [selectedApi, loadPosDashboard]);

  const selectApi = (api: ApiKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("api", api);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const resetSelection = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("api");
    router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
  };

  if (!selectedApi) {
    return (
      <div className="relative min-h-[calc(100vh-2.5rem)] overflow-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/30">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]"
          aria-hidden
        />
        <div
          className="api-home-orb pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl"
          aria-hidden
        />
        <div
          className="api-home-orb-delayed pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:20px_20px]"
          aria-hidden
        />

        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-200/80 bg-white/70 px-4 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 sm:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-teal-400/20 opacity-80 blur-md" />
              <Image
                src="/LOGO_Same_Day.jpeg"
                alt="Same Day Solution"
                width={48}
                height={48}
                priority
                className="relative h-11 w-11 rounded-xl object-cover shadow-md ring-1 ring-black/[0.06]"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
                Same Day Solution
              </p>
              <p className="truncate text-[11px] italic text-emerald-800/90 sm:text-xs">
                Aapke Har Transaction Ka Saathi
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1 text-[11px] font-medium text-emerald-800 shadow-sm sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            API Portal
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8 sm:pt-10">
          <div
            className={`mx-auto mb-10 max-w-2xl text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              API dashboards
            </h1>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
              Pick a module to open its analytics workspace. Each product has its own metrics, charts, and tools.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
            {API_OPTIONS.map((api, index) => {
              const Icon = api.icon;
              const n = String(index + 1).padStart(2, "0");
              return (
                <button
                  key={api.key}
                  type="button"
                  onClick={() => selectApi(api.key)}
                  style={{
                    transitionDelay: mounted ? `${index * 55}ms` : "0ms",
                  }}
                  className={`group relative cursor-api-open text-left outline-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-150 ${
                    mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                  } focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 active:cursor-grabbing`}
                >
                  <span
                    className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl transition-all duration-700 ease-out group-hover:scale-110 ${api.accent.orb}`}
                    aria-hidden
                  />
                  <span
                    className={`pointer-events-none absolute right-4 top-4 h-24 w-24 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 ${api.accent.corner}`}
                    aria-hidden
                  />

                  <span className="relative flex min-h-[168px] flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white/85 p-6 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-white/80 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/90 before:to-slate-50/40 before:opacity-0 before:transition-opacity before:duration-500 group-hover:before:opacity-100 group-hover:shadow-[0_24px_50px_-16px_rgba(16,185,129,0.22)] group-hover:ring-emerald-300/40 motion-reduce:group-hover:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] motion-reduce:before:transition-none sm:min-h-[180px]">
                    <span
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      aria-hidden
                    >
                      <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[100%] motion-reduce:transition-none" />
                    </span>

                    <span className="relative mb-4 flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:rotate-[-3deg] ${api.accent.chip}`}
                      >
                        <Icon className="h-7 w-7" strokeWidth={1.75} />
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <span className="font-mono text-[10px] font-medium tabular-nums text-slate-400 transition-colors duration-300 group-hover:text-emerald-700/80">
                          {n}
                        </span>
                        <ChevronRight
                          className="h-5 w-5 shrink-0 text-slate-300 transition-all duration-500 ease-out group-hover:translate-x-1 group-hover:text-emerald-600"
                          aria-hidden
                        />
                      </span>
                    </span>

                    <span className="relative mt-auto space-y-1.5">
                      <span className="block text-base font-semibold leading-snug text-slate-900 transition-colors duration-300 group-hover:text-emerald-950">
                        {api.label}
                      </span>
                      <span className="block text-sm leading-relaxed text-slate-600">
                        {api.description}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className={`mt-12 text-center transition-all duration-700 ease-out motion-reduce:transition-none ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: mounted ? "400ms" : "0ms" }}
          >
            <p className="text-xs text-slate-500">
              POS Partner API Portal &bull; Same Day Solution Pvt Ltd
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedApi === "settlement") {
    return <SettlementPayoutDashboard onBack={resetSelection} />;
  }

  const selectedApiOption = API_OPTIONS.find((option) => option.key === selectedApi);

  if (selectedApi !== "pos-transaction-api") {
    return (
      <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedApiOption?.label} Dashboard</h1>
            <p className="text-sm text-muted-foreground">Dedicated dashboard shell ready for API integration.</p>
          </div>
          <Button variant="outline" onClick={resetSelection} className="transition-all hover:scale-105 active:scale-95">
            <MoveLeft className="h-4 w-4" />
            Change API
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: 0, icon: ArrowLeftRight, accent: "blue" as const, delay: 0 },
            { label: "Total Amount", value: "₹0", icon: IndianRupee, accent: "green" as const, delay: 75 },
            { label: "Success", value: 0, icon: CheckCircle2, accent: "green" as const, delay: 150 },
            { label: "Failed", value: 0, icon: XCircle, accent: "red" as const, delay: 225 },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${stat.delay}ms`, animationFillMode: "both" }}
            >
              <StatCard label={stat.label} value={stat.value} icon={stat.icon} accent={stat.accent} />
            </div>
          ))}
        </div>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          <CardHeader>
            <CardTitle>Integration Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Connect backend endpoints for {selectedApiOption?.label} to populate metrics, charts and transaction-level data.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">POS Transaction Dashboard</h1>
          <Button variant="outline" onClick={resetSelection}>
            <MoveLeft className="h-4 w-4" />
            Change API
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 h-24 animate-pulse bg-muted rounded-lg" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">POS Transaction Dashboard</h1>
          <Button variant="outline" onClick={resetSelection}>
            <MoveLeft className="h-4 w-4" />
            Change API
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-2 font-medium">Failed to load dashboard data</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button onClick={loadPosDashboard} className="text-sm text-green-700 underline">Retry</button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const s = data?.summary;
  const txns = data?.data ?? [];
  const dailyData = groupByDate(txns);
  const modeData = groupByPaymentMode(txns);

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">POS Transaction Dashboard</h1>
          <p className="text-sm text-muted-foreground">Last 90 days overview (max range)</p>
        </div>
        <Button variant="outline" onClick={resetSelection} className="transition-all hover:scale-105 active:scale-95">
          <MoveLeft className="h-4 w-4" />
          Change API
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Transactions", value: s?.total_transactions ?? 0, icon: ArrowLeftRight, accent: "blue" as const },
          { label: "Total Amount", value: `₹${Number(s?.total_amount ?? 0).toLocaleString("en-IN")}`, icon: IndianRupee, accent: "green" as const },
          { label: "Captured", value: s?.captured_count ?? 0, icon: CheckCircle2, accent: "green" as const },
          { label: "Failed", value: s?.failed_count ?? 0, icon: XCircle, accent: "red" as const },
          { label: "Terminals", value: s?.terminal_count ?? 0, icon: HardDrive, accent: "orange" as const },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${i * 75}ms`, animationFillMode: "both" }}
          >
            <StatCard label={stat.label} value={stat.value} icon={stat.icon} accent={stat.accent} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card 
          className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: "400ms", animationFillMode: "both" }}
        >
          <CardHeader>
            <CardTitle className="text-base">Daily Transaction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No transaction data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => typeof v === "number" ? v.toLocaleString("en-IN") : String(v ?? "")} />
                  <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: "475ms", animationFillMode: "both" }}
        >
          <CardHeader>
            <CardTitle className="text-base">Payment Modes</CardTitle>
          </CardHeader>
          <CardContent>
            {modeData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={modeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {modeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
