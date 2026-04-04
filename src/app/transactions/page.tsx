"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays, startOfDay, endOfDay, differenceInDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
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
import { DateRangePicker } from "@/components/date-range-picker";
import { StatusBadge } from "@/components/status-badge";
import { TransactionDetail } from "@/components/transaction-detail";
import { fetchTransactions } from "@/lib/client-api";
import type { Transaction, TransactionResponse } from "@/lib/types";

const STATUSES = ["ALL", "CAPTURED", "AUTHORIZED", "FAILED", "REFUNDED", "VOIDED"];
const PAYMENT_MODES = ["ALL", "CARD", "UPI", "NFC", "CASH", "WALLET", "NETBANKING", "BHARATQR"];

function downloadCsv(txns: Transaction[]) {
  if (!txns.length) return;
  const headers = [
    "txn_time", "posting_date", "terminal_id", "amount", "status", "payment_mode",
    "card_brand", "card_type", "card_number", "card_classification", "card_txn_type",
    "issuing_bank", "acquiring_bank", "customer_name", "payer_name", "rrn",
    "auth_code", "txn_type", "razorpay_txn_id", "external_ref", "device_serial",
    "mid", "currency", "receipt_url", "created_at",
  ];
  const rows = txns.map((t) =>
    headers.map((h) => {
      const v = t[h as keyof Transaction];
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions_${format(new Date(), "yyyy-MM-dd_HHmmss")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 89),
    to: new Date(),
  });
  const [status, setStatus] = useState("ALL");
  const [paymentMode, setPaymentMode] = useState("ALL");
  const [terminalId, setTerminalId] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const dateRangeDays = dateRange?.from && dateRange?.to
    ? differenceInDays(dateRange.to, dateRange.from)
    : 0;
  const dateRangeTooWide = dateRangeDays > 90;

  const load = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    if (differenceInDays(dateRange.to, dateRange.from) > 90) {
      setError("Date range cannot exceed 90 days (API limit). Please narrow your selection.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTransactions({
        date_from: startOfDay(dateRange.from).toISOString(),
        date_to: endOfDay(dateRange.to).toISOString(),
        status: status === "ALL" ? null : status,
        payment_mode: paymentMode === "ALL" ? null : paymentMode,
        terminal_id: terminalId.trim() || null,
        page,
        page_size: 50,
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [dateRange, status, paymentMode, terminalId, page]);

  useEffect(() => { load(); }, [load]);

  const pagination = data?.pagination;
  const txns = data?.data ?? [];
  const summary = data?.summary;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {summary ? `${summary.total_transactions} transactions · ₹${Number(summary.total_amount).toLocaleString("en-IN")}` : "Loading…"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadCsv(txns)} disabled={!txns.length}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <DateRangePicker value={dateRange} onChange={setDateRange} className="w-[280px]" />
              {dateRangeTooWide && (
                <p className="text-xs text-red-600 mt-1">Max 90 days allowed</p>
              )}
            </div>
            <Select value={status} onValueChange={(v) => { if (v) { setStatus(v); setPage(1); } }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={paymentMode} onValueChange={(v) => { if (v) { setPaymentMode(v); setPage(1); } }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Payment mode" /></SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Terminal ID"
                value={terminalId}
                onChange={(e) => { setTerminalId(e.target.value); setPage(1); }}
                className="pl-8 w-[160px]"
              />
            </div>
            <Button onClick={() => { setPage(1); load(); }} size="sm">Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading transactions…</div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-2">{error}</p>
              <button onClick={load} className="text-sm text-green-700 underline">Retry</button>
            </div>
          ) : txns.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No transactions found for this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Terminal</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Entry Mode</TableHead>
                    <TableHead>Acquiring Bank</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>RRN</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txns.map((txn) => (
                    <TableRow
                      key={txn.id}
                      className="cursor-pointer hover:bg-green-50/50"
                      onClick={() => setSelectedTxn(txn)}
                    >
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(txn.txn_time).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{txn.terminal_id}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{Number(txn.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell><StatusBadge status={txn.status} /></TableCell>
                      <TableCell className="text-xs">{txn.payment_mode}</TableCell>
                      <TableCell className="text-xs">{txn.card_brand} {txn.card_type}</TableCell>
                      <TableCell className="text-xs">{txn.card_classification ?? "—"}</TableCell>
                      <TableCell className="text-xs">{txn.card_txn_type ?? "—"}</TableCell>
                      <TableCell className="text-xs">{txn.acquiring_bank || "—"}</TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{txn.customer_name}</TableCell>
                      <TableCell className="font-mono text-xs">{txn.rrn}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.total_pages} · {pagination.total_records} records
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!pagination.has_prev} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={!pagination.has_next} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <TransactionDetail txn={selectedTxn} open={!!selectedTxn} onClose={() => setSelectedTxn(null)} />
    </div>
  );
}
