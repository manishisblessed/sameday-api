import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  CAPTURED: "bg-green-100 text-green-800 border-green-200",
  AUTHORIZED: "bg-blue-100 text-blue-800 border-blue-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  REFUNDED: "bg-orange-100 text-orange-800 border-orange-200",
  VOIDED: "bg-gray-100 text-gray-800 border-gray-200",
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  decommissioned: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
  QUEUED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-semibold", statusColors[status] ?? "")}>
      {status}
    </Badge>
  );
}
