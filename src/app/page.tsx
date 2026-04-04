"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  IndianRupee,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  HardDrive,
} from "lucide-react";
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
import { fetchTransactions } from "@/lib/client-api";
import type { Transaction, TransactionResponse } from "@/lib/types";

const PIE_COLORS = ["#16a34a", "#ea580c", "#2563eb", "#9333ea", "#dc2626", "#ca8a04"];

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
  const [data, setData] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-muted rounded-lg" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-2 font-medium">Failed to load dashboard data</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button onClick={load} className="text-sm text-green-700 underline">Retry</button>
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Last 90 days overview (max range)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Transactions" value={s?.total_transactions ?? 0} icon={ArrowLeftRight} accent="blue" />
        <StatCard label="Total Amount" value={`₹${Number(s?.total_amount ?? 0).toLocaleString("en-IN")}`} icon={IndianRupee} accent="green" />
        <StatCard label="Captured" value={s?.captured_count ?? 0} icon={CheckCircle2} accent="green" />
        <StatCard label="Failed" value={s?.failed_count ?? 0} icon={XCircle} accent="red" />
        <StatCard label="Terminals" value={s?.terminal_count ?? 0} icon={HardDrive} accent="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
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

        <Card>
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
