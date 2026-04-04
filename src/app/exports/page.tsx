"use client";

import { useState, useEffect, useRef } from "react";
import { format, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Download, Loader2, CheckCircle2, Clock, FileDown, Search, AlertCircle } from "lucide-react";
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
import { DateRangePicker } from "@/components/date-range-picker";
import { StatusBadge } from "@/components/status-badge";
import { createExportJob, checkExportStatus } from "@/lib/client-api";
import type { ExportJob } from "@/lib/types";

const STATUSES = ["ALL", "CAPTURED", "AUTHORIZED", "FAILED", "REFUNDED", "VOIDED"];

interface JobEntry {
  job: ExportJob;
  polling: boolean;
}

export default function ExportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 89),
    to: new Date(),
  });
  const [exportFormat, setExportFormat] = useState("csv");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [terminalId, setTerminalId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [remainingExports, setRemainingExports] = useState<number | null>(null);
  const pollTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    return () => {
      pollTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function startAutoPoll(jobId: string) {
    const poll = async () => {
      try {
        const res = await checkExportStatus(jobId);
        const job = "job" in res.data ? res.data.job : (res.data as ExportJob);
        setJobs((prev) => prev.map((j) => (j.job.job_id === jobId ? { job, polling: false } : j)));
        if (job.status === "QUEUED" || job.status === "PROCESSING") {
          const timer = setTimeout(poll, 5000);
          pollTimers.current.set(jobId, timer);
        } else {
          pollTimers.current.delete(jobId);
        }
      } catch {
        setJobs((prev) => prev.map((j) => (j.job.job_id === jobId ? { ...j, polling: false } : j)));
        pollTimers.current.delete(jobId);
      }
    };
    setJobs((prev) => prev.map((j) => (j.job.job_id === jobId ? { ...j, polling: true } : j)));
    const timer = setTimeout(poll, 3000);
    pollTimers.current.set(jobId, timer);
  }

  async function handleCreate() {
    if (!dateRange?.from || !dateRange?.to) return;
    setCreating(true);
    setError(null);
    try {
      const res = await createExportJob({
        format: exportFormat,
        date_from: format(dateRange.from, "yyyy-MM-dd"),
        date_to: format(dateRange.to, "yyyy-MM-dd"),
        status: statusFilter === "ALL" ? null : statusFilter,
        terminal_id: terminalId.trim() || null,
      });
      const job = "job" in res.data ? res.data.job : (res.data as ExportJob);
      if (job.remaining_exports_today != null) {
        setRemainingExports(job.remaining_exports_today);
      }
      setJobs((prev) => [{ job, polling: false }, ...prev]);
      if (job.status === "QUEUED" || job.status === "PROCESSING") {
        startAutoPoll(job.job_id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  async function pollJob(jobId: string) {
    setJobs((prev) => prev.map((j) => (j.job.job_id === jobId ? { ...j, polling: true } : j)));
    try {
      const res = await checkExportStatus(jobId);
      const job = "job" in res.data ? res.data.job : (res.data as ExportJob);
      setJobs((prev) => prev.map((j) => (j.job.job_id === jobId ? { job, polling: false } : j)));
      if (job.status === "QUEUED" || job.status === "PROCESSING") {
        startAutoPoll(jobId);
      }
    } catch {
      setJobs((prev) => prev.map((j) => (j.job.job_id === jobId ? { ...j, polling: false } : j)));
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exports</h1>
        <p className="text-sm text-muted-foreground">
          Create and download transaction export files
          {remainingExports != null && (
            <span className="ml-2 text-xs font-medium">
              ({remainingExports} export{remainingExports !== 1 ? "s" : ""} remaining today)
            </span>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create export job</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <DateRangePicker value={dateRange} onChange={setDateRange} className="w-[280px]" />
            <Select value={exportFormat} onValueChange={(v) => { if (v) setExportFormat(v); }}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF Report</SelectItem>
                <SelectItem value="zip">ZIP (CSV+PDF)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status filter" /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Terminal ID (optional)"
                value={terminalId}
                onChange={(e) => setTerminalId(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            <Button onClick={handleCreate} disabled={creating || !dateRange?.from || !dateRange?.to}>
              {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
              {creating ? "Creating…" : "Create export"}
            </Button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobs.map(({ job, polling }) => (
              <div key={job.job_id} className="flex items-center justify-between border rounded-lg p-4 bg-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={job.status} />
                    <span className="text-sm font-medium uppercase">{job.format}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{job.job_id}</p>
                  {job.record_count != null && (
                    <p className="text-xs text-muted-foreground">{job.record_count} records · {((job.file_size_bytes ?? 0) / 1024).toFixed(1)} KB</p>
                  )}
                  {job.created_at && (
                    <p className="text-xs text-muted-foreground">Created: {new Date(job.created_at).toLocaleString()}</p>
                  )}
                  {job.expires_at && job.status === "COMPLETED" && (
                    <p className="text-xs text-muted-foreground">Link expires: {new Date(job.expires_at).toLocaleString()}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {job.status === "COMPLETED" && job.file_url ? (
                    <a href={job.file_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm">
                        <FileDown className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </a>
                  ) : job.status === "QUEUED" || job.status === "PROCESSING" ? (
                    <Button variant="outline" size="sm" onClick={() => pollJob(job.job_id)} disabled={polling}>
                      {polling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4 mr-1" />}
                      {polling ? "Checking…" : "Check status"}
                    </Button>
                  ) : job.status === "COMPLETED" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : job.status === "FAILED" ? (
                    <span className="text-xs text-red-600 font-medium">Export failed</span>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
