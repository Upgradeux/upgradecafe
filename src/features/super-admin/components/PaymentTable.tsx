"use client";

import React from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentListItem } from "../services/payment-admin.service";
import { IconReceipt } from "@tabler/icons-react";

export interface PaymentTableProps {
  payments: PaymentListItem[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  total,
  page,
  totalPages,
  onPageChange,
  isLoading = false,
}) => {
  const methodVariantMap: Record<string, "primary" | "neutral" | "active" | "grace"> = {
    UPI: "primary",
    BANK_TRANSFER: "active",
    CASH: "grace",
    CARD: "neutral",
    OTHER: "neutral",
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)]">
      {isLoading ? (
        <div className="p-10 text-center text-xs text-[var(--color-muted)]">
          Loading payment transactions...
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<IconReceipt className="w-6 h-6" />}
          title="No payment records found"
          description="Offline payments recorded by Super Admin will appear here."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Café</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference / Txn ID</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link
                    href={`/admin/cafes/${p.cafeId}`}
                    className="font-semibold text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
                  >
                    {p.cafeName}
                  </Link>
                </TableCell>

                <TableCell className="font-bold text-[var(--color-foreground)] font-mono">
                  ₹{p.amount.toLocaleString("en-IN")}
                </TableCell>

                <TableCell>
                  <Badge variant={methodVariantMap[p.paymentMethod] || "neutral"}>
                    {p.paymentMethod}
                  </Badge>
                </TableCell>

                <TableCell className="font-mono text-xs text-[var(--color-muted)]">
                  {p.referenceNumber || "—"}
                </TableCell>

                <TableCell className="text-xs text-[var(--color-muted)]">
                  {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>

                <TableCell className="text-xs text-[var(--color-foreground)]">
                  {p.recordedByName}
                </TableCell>

                <TableCell className="text-xs text-[var(--color-muted)] max-w-xs truncate">
                  {p.notes || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="border-t border-[var(--color-border-subtle)] px-4 py-2 bg-[var(--color-surface)]">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};
