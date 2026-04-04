"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, HardDrive } from "lucide-react";
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
import { StatusBadge } from "@/components/status-badge";
import { fetchMachines } from "@/lib/client-api";
import type { MachineResponse } from "@/lib/types";

const MACHINE_STATUSES = ["ALL", "active", "inactive", "maintenance", "decommissioned"];

export default function MachinesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MachineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: Record<string, string> = { page: String(page), limit: "50" };
      if (search.trim()) query.search = search.trim();
      if (statusFilter !== "ALL") query.status = statusFilter;
      const res = await fetchMachines(query);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const machines = data?.data ?? [];
  const pagination = data?.pagination;

  const activeMachines = machines.filter((m) => m.status === "active").length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">POS Machines</h1>
        <p className="text-sm text-muted-foreground">
          {pagination
            ? `${pagination.total} machine${pagination.total !== 1 ? "s" : ""} assigned${activeMachines > 0 ? ` · ${activeMachines} active on this page` : ""}`
            : "Loading…"}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search TID, serial, model…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 w-[260px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1); } }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {MACHINE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s === "ALL" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { setPage(1); load(); }} size="sm">Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading machines…</div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-2">{error}</p>
              <button onClick={load} className="text-sm text-green-700 underline">Retry</button>
            </div>
          ) : machines.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <HardDrive className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No machines found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Terminal ID</TableHead>
                    <TableHead>Device Serial</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Retailer</TableHead>
                    <TableHead>Retailer Code</TableHead>
                    <TableHead>City / State</TableHead>
                    <TableHead>Activated</TableHead>
                    <TableHead>Last Txn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-sm">{m.terminal_id}</TableCell>
                      <TableCell className="font-mono text-xs">{m.device_serial}</TableCell>
                      <TableCell className="text-sm">{m.machine_model}</TableCell>
                      <TableCell><StatusBadge status={m.status} /></TableCell>
                      <TableCell className="text-sm max-w-[180px]">
                        <div className="truncate font-medium">{m.retailer_name || "—"}</div>
                        {m.retailer_business_name && m.retailer_business_name !== m.retailer_name && (
                          <div className="truncate text-xs text-muted-foreground">{m.retailer_business_name}</div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{m.retailer_code || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {m.retailer_city || m.retailer_state
                          ? `${m.retailer_city || ""}${m.retailer_city && m.retailer_state ? ", " : ""}${m.retailer_state || ""}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {m.activated_at ? new Date(m.activated_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {m.last_txn_at ? new Date(m.last_txn_at).toLocaleString() : "—"}
                      </TableCell>
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
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} machines
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!pagination.has_prev_page} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={!pagination.has_next_page} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
