"use client";

import { useEffect, useState } from "react";
import { fetchHealth } from "@/lib/client-api";
import type { HealthResponse } from "@/lib/types";
import { Activity, AlertCircle } from "lucide-react";

export function HealthBanner() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>API unreachable: {error}</span>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b text-muted-foreground text-sm">
        <Activity className="h-4 w-4 animate-pulse" />
        <span>Checking API health…</span>
      </div>
    );
  }

  const dbOk = health.database?.status === "healthy";

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-200 text-green-700 text-sm">
      <Activity className="h-4 w-4" />
      <span>
        API healthy &middot; {health.service} v{health.version}
        {dbOk ? " · DB healthy" : ""}
      </span>
    </div>
  );
}
