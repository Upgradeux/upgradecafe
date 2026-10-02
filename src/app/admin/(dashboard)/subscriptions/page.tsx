"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminHeader } from "@/features/super-admin/components/AdminHeader";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { SubscriptionListItem } from "@/features/super-admin/services/subscription-admin.service";
import { Plan } from "@/lib/db/schema/plans";
import { IconEdit } from "@tabler/icons-react";

export default function AdminSubscriptionsPage() {
  const toast = useToast();
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Subscription Modal state
  const [editingSub, setEditingSub] = useState<SubscriptionListItem | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedExpiresAt, setSelectedExpiresAt] = useState("");
  const [selectedGraceDays, setSelectedGraceDays] = useState(7);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/subscriptions?page=${page}&limit=15`);
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.data.subscriptions);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subscriptions.");
    } finally {
      setIsLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchSubscriptions();
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPlans(d.data || []);
      });
  }, [fetchSubscriptions]);

  const handleOpenEdit = (sub: SubscriptionListItem) => {
    setEditingSub(sub);
    setSelectedPlanId(sub.planId);
    setSelectedExpiresAt(
      new Date(sub.expiresAt).toISOString().split("T")[0]
    );
    setSelectedGraceDays(sub.gracePeriodDays);
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${editingSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          expiresAt: selectedExpiresAt,
          gracePeriodDays: selectedGraceDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to update");

      toast.success("Subscription updated successfully.");
      setEditingSub(null);
      fetchSubscriptions();
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Subscription Oversight"
        subtitle="Manage billing cycles, expiry dates, and plan assignments across all active tenants."
      />

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-[var(--color-muted)]">
            Loading tenant subscriptions...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Café Tenant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Billing Cycle</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Grace Period</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <Link
                      href={`/admin/cafes/${sub.cafeId}`}
                      className="font-semibold text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
                    >
                      {sub.cafeName}
                    </Link>
                  </TableCell>

                  <TableCell className="font-medium">{sub.planName}</TableCell>
                  <TableCell>
                    <Badge variant="neutral">{sub.billingCycle}</Badge>
                  </TableCell>

                  <TableCell className="text-xs text-[var(--color-muted)]">
                    {new Date(sub.startsAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>

                  <TableCell className="text-xs font-semibold font-mono">
                    {new Date(sub.expiresAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>

                  <TableCell className="text-xs">{sub.gracePeriodDays} days</TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(sub)}
                      leftIcon={<IconEdit className="w-3.5 h-3.5" />}
                    >
                      Modify
                    </Button>
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
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>

      {/* Edit Subscription Modal */}
      {editingSub && (
        <Modal
          isOpen={true}
          onClose={() => setEditingSub(null)}
          title={`Modify Subscription: ${editingSub.cafeName}`}
          description="Adjust plan tier, set custom expiry date, or change grace period allocation."
          maxWidth="md"
        >
          <form onSubmit={handleSaveSubscription} className="space-y-4">
            <Select
              label="Assigned Plan"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              options={plans.map((p) => ({
                value: p.id,
                label: `${p.name} (₹${p.monthlyPrice}/mo)`,
              }))}
            />

            <Input
              label="Expiry Date"
              type="date"
              required
              value={selectedExpiresAt}
              onChange={(e) => setSelectedExpiresAt(e.target.value)}
            />

            <Input
              label="Grace Period (Days)"
              type="number"
              min="0"
              max="60"
              required
              value={selectedGraceDays}
              onChange={(e) => setSelectedGraceDays(parseInt(e.target.value, 10))}
              helperText="Days tenant remains accessible after expiry before automatic suspension."
            />

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-subtle)]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingSub(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
