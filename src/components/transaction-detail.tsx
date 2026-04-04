"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/status-badge";
import type { Transaction } from "@/lib/types";

interface Props {
  txn: Transaction | null;
  open: boolean;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] break-all">{value ?? "—"}</span>
    </div>
  );
}

export function TransactionDetail({ txn, open, onClose }: Props) {
  if (!txn) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Transaction Detail
            <StatusBadge status={txn.status} />
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-0">
          <Row label="Amount" value={`₹${Number(txn.amount).toLocaleString("en-IN")}`} />
          <Row label="Status" value={txn.status} />
          <Row label="Terminal ID" value={txn.terminal_id} />
          <Row label="Payment Mode" value={txn.payment_mode} />
          <Row label="Card Brand" value={txn.card_brand} />
          <Row label="Card Type" value={txn.card_type} />
          <Row label="Card Number" value={txn.card_number} />
          <Row label="Card Classification" value={txn.card_classification} />
          <Row label="Card Txn Type" value={txn.card_txn_type} />
          <Row label="Issuing Bank" value={txn.issuing_bank} />
          <Row label="Acquiring Bank" value={txn.acquiring_bank} />
          <Row label="Customer Name" value={txn.customer_name} />
          <Row label="Payer Name" value={txn.payer_name} />
          <Row label="RRN" value={txn.rrn} />
          <Row label="Auth Code" value={txn.auth_code} />
          <Row label="MID" value={txn.mid} />
          <Row label="Razorpay Txn ID" value={txn.razorpay_txn_id} />
          <Row label="External Ref" value={txn.external_ref} />
          <Row label="Device Serial" value={txn.device_serial} />
          <Row label="Currency" value={txn.currency} />
          <Row label="Txn Type" value={txn.txn_type} />
          <Row label="Txn Time" value={txn.txn_time ? new Date(txn.txn_time).toLocaleString() : "—"} />
          <Row label="Posting Date" value={txn.posting_date ? new Date(txn.posting_date).toLocaleString() : "—"} />
          {txn.receipt_url && (
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Receipt</span>
              <a href={txn.receipt_url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 underline">
                View receipt
              </a>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
