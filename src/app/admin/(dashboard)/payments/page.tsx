"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/features/super-admin/components/AdminHeader";
import { PaymentTable } from "@/features/super-admin/components/PaymentTable";
import { PaymentForm } from "@/features/super-admin/components/PaymentForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { PaymentListItem } from "@/features/super-admin/services/payment-admin.service";
import { CafeListItem } from "@/features/super-admin/services/cafe-admin.service";
import { IconPlus } from "@tabler/icons-react";

export default function AdminPaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [totals, setTotals] = useState({ totalRevenue: 0, totalTransactions: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Record payment modal
  const [cafes, setCafes] = useState<CafeListItem[]>([]);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedCafeId, setSelectedCafeId] = useState("");

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });
      if (methodFilter !== "ALL") params.set("paymentMethod", methodFilter);

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.data.payments);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
        if (data.totals) setTotals(data.totals);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payments.");
    } finally {
      setIsLoading(false);
    }
  }, [page, methodFilter, toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    // Pre-fetch cafes for payment modal dropdown
    fetch("/api/admin/cafes?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCafes(d.data.cafes || []);
          if (d.data.cafes.length > 0) {
            setSelectedCafeId(d.data.cafes[0].id);
          }
        }
      });
  }, []);

  const selectedCafe = cafes.find((c) => c.id === selectedCafeId) || cafes[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminHeader
          title="Offline Payments & Billing Ledger"
          subtitle="Administrative record of manual payments collected offline (Cash, UPI, Bank Transfer)."
        />
        <Button
          size="sm"
          onClick={() => setIsRecordModalOpen(true)}
          leftIcon={<IconPlus className="w-3.5 h-3.5" />}
        >
          Record Offline Payment
        </Button>
      </div>

      {/* Revenue KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-[var(--color-border)]">
          <div className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wide">
            Total Offline Revenue
          </div>
          <div className="text-[28px] font-bold text-[var(--color-foreground)] tracking-tight mt-1 font-mono">
            ₹{totals.totalRevenue.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
            100% verified manual receipts
          </div>
        </Card>

        <Card className="p-4 border border-[var(--color-border)]">
          <div className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wide">
            Recorded Transactions
          </div>
          <div className="text-[28px] font-bold text-[var(--color-foreground)] tracking-tight mt-1">
            {totals.totalTransactions}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
            Audit logs linked to each receipt
          </div>
        </Card>

        <Card className="p-4 border border-[var(--color-border)]">
          <div className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wide">
            Filter by Payment Channel
          </div>
          <div className="mt-2">
            <Select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All Payment Methods" },
                { value: "UPI", label: "UPI (Google Pay, PhonePe, Paytm)" },
                { value: "BANK_TRANSFER", label: "Bank Transfer (NEFT, IMPS)" },
                { value: "CASH", label: "Direct Cash" },
                { value: "CARD", label: "Debit / Credit Card" },
                { value: "OTHER", label: "Other" },
              ]}
            />
          </div>
        </Card>
      </div>

      {/* Ledger Table */}
      <PaymentTable
        payments={payments}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        isLoading={isLoading}
      />

      {/* Record Payment Modal */}
      {isRecordModalOpen && selectedCafe && (
        <PaymentForm
          isOpen={true}
          onClose={() => setIsRecordModalOpen(false)}
          cafeId={selectedCafe.id}
          cafeName={selectedCafe.name}
          onSuccess={() => {
            toast.success("Payment recorded successfully.");
            fetchPayments();
          }}
        />
      )}
    </div>
  );
}
