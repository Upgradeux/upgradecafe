"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/features/super-admin/components/AdminHeader";
import { CafeTable } from "@/features/super-admin/components/CafeTable";
import { PaymentForm } from "@/features/super-admin/components/PaymentForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { CafeListItem } from "@/features/super-admin/services/cafe-admin.service";

export default function AdminCafesPage() {
  const toast = useToast();
  const [cafes, setCafes] = useState<CafeListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [paymentCafe, setPaymentCafe] = useState<CafeListItem | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{
    cafe: CafeListItem;
    action: "SUSPEND" | "REACTIVATE" | "ARCHIVE";
  } | null>(null);
  const [isMutatingStatus, setIsMutatingStatus] = useState(false);

  const fetchCafes = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/cafes?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCafes(data.data.cafes);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch cafes:", err);
      toast.error("Failed to load cafés list.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter, toast]);

  useEffect(() => {
    fetchCafes();
  }, [fetchCafes]);

  const handleStatusSubmit = async () => {
    if (!statusConfirm) return;
    setIsMutatingStatus(true);
    try {
      const res = await fetch(`/api/admin/cafes/${statusConfirm.cafe.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: statusConfirm.action,
          reason: `Actioned via Super Admin dashboard`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Action failed");
      }

      toast.success(
        `Café ${statusConfirm.cafe.name} ${
          statusConfirm.action === "SUSPEND"
            ? "suspended"
            : statusConfirm.action === "REACTIVATE"
            ? "reactivated"
            : "archived"
        } successfully.`
      );
      setStatusConfirm(null);
      fetchCafes();
    } catch (err: any) {
      toast.error(err.message || "Failed to update café status.");
    } finally {
      setIsMutatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Café Tenants Management"
        subtitle={`Managing ${total} provisioned café accounts across the platform.`}
      />

      <CafeTable
        cafes={cafes}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        searchQuery={search}
        statusFilter={statusFilter}
        onSearchChange={(q) => {
          setSearch(q);
          setPage(1);
        }}
        onStatusChange={(s) => {
          setStatusFilter(s);
          setPage(1);
        }}
        onPageChange={(p) => setPage(p)}
        onRecordPayment={(cafe) => setPaymentCafe(cafe)}
        onToggleStatus={(cafe, action) => setStatusConfirm({ cafe, action })}
        isLoading={isLoading}
      />

      {/* Offline Payment Modal */}
      {paymentCafe && (
        <PaymentForm
          isOpen={true}
          onClose={() => setPaymentCafe(null)}
          cafeId={paymentCafe.id}
          cafeName={paymentCafe.name}
          onSuccess={() => {
            toast.success(`Payment recorded for ${paymentCafe.name}`);
            fetchCafes();
          }}
        />
      )}

      {/* Suspend / Reactivate / Archive Confirm Dialog */}
      {statusConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setStatusConfirm(null)}
          onConfirm={handleStatusSubmit}
          title={
            statusConfirm.action === "SUSPEND"
              ? `Suspend Café "${statusConfirm.cafe.name}"?`
              : statusConfirm.action === "REACTIVATE"
              ? `Reactivate Café "${statusConfirm.cafe.name}"?`
              : `Archive Café "${statusConfirm.cafe.name}"?`
          }
          description={
            statusConfirm.action === "SUSPEND"
              ? "Suspending will block the café owner, staff dashboard, and public menu operations immediately. Super Admin retains full administrative access."
              : statusConfirm.action === "REACTIVATE"
              ? "Reactivating will grant immediate access back to the owner, staff dashboard, and public menu."
              : "Archiving will preserve business records under soft delete semantics while disabling tenant operations."
          }
          variant={statusConfirm.action === "REACTIVATE" ? "primary" : "danger"}
          confirmText={
            statusConfirm.action === "SUSPEND"
              ? "Suspend Tenant"
              : statusConfirm.action === "REACTIVATE"
              ? "Reactivate Tenant"
              : "Archive Tenant"
          }
          isLoading={isMutatingStatus}
        />
      )}
    </div>
  );
}
