"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { AdminHeader } from "@/features/super-admin/components/AdminHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CafeStatusBadge } from "@/features/super-admin/components/CafeStatusBadge";
import { PaymentForm } from "@/features/super-admin/components/PaymentForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import {
  IconEdit,
  IconReceipt,
  IconPlayerPause,
  IconPlayerPlay,
  IconArchive,
  IconCoffee,
  IconUser,
  IconCalendar,
  IconExternalLink,
} from "@tabler/icons-react";

export default function CafeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const toast = useToast();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [statusConfirmAction, setStatusConfirmAction] = useState<
    "SUSPEND" | "REACTIVATE" | "ARCHIVE" | null
  >(null);
  const [isMutatingStatus, setIsMutatingStatus] = useState(false);

  const fetchCafeDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/cafes/${id}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.error?.message || "Failed to load café.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch café details.");
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchCafeDetails();
  }, [fetchCafeDetails]);

  const handleStatusChange = async () => {
    if (!statusConfirmAction) return;
    setIsMutatingStatus(true);
    try {
      const res = await fetch(`/api/admin/cafes/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: statusConfirmAction,
          reason: "Updated from Café Overview Page",
        }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error?.message || "Status update failed");

      toast.success(`Café status updated successfully.`);
      setStatusConfirmAction(null);
      fetchCafeDetails();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setIsMutatingStatus(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="p-12 text-center text-xs text-[var(--color-muted)]">
        Loading café details...
      </div>
    );
  }

  const { cafe, subscription, plan, members, recentPayments, accessState } = data;
  const isSuspended = accessState.status === "SUSPENDED";
  const isArchived = accessState.status === "ARCHIVED";

  return (
    <div className="space-y-6">
      <AdminHeader
        title={cafe.name}
        subtitle={`Tenant ID: ${cafe.id} • Slug: /${cafe.slug}`}
      />

      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-subtle)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[var(--radius-button)] bg-white overflow-hidden p-1 flex items-center justify-center font-bold text-lg border border-[var(--color-border)] shadow-2xs">
            {cafe.logoKey ? (
              <img
                src={cafe.logoKey}
                alt={cafe.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-[var(--color-primary)] font-bold">
                {cafe.name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--color-foreground)] tracking-tight">
                {cafe.name}
              </h2>
              <CafeStatusBadge accessState={accessState} />
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Access rule: {accessState.reason}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/cafe/${cafe.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              leftIcon={<IconExternalLink className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
            >
              Open Café Portal
            </Button>
          </a>

          <Button
            size="sm"
            onClick={() => setIsPaymentModalOpen(true)}
            leftIcon={<IconReceipt className="w-3.5 h-3.5 text-white" />}
          >
            Record Payment
          </Button>

          <Link href={`/admin/cafes/${cafe.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<IconEdit className="w-3.5 h-3.5" />}
            >
              Edit Café
            </Button>
          </Link>

          {isSuspended ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStatusConfirmAction("REACTIVATE")}
              leftIcon={<IconPlayerPlay className="w-3.5 h-3.5 text-[var(--color-success)]" />}
            >
              Reactivate
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={isArchived}
              onClick={() => setStatusConfirmAction("SUSPEND")}
              leftIcon={<IconPlayerPause className="w-3.5 h-3.5 text-[var(--color-danger)]" />}
            >
              Suspend
            </Button>
          )}

          {!isArchived && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusConfirmAction("ARCHIVE")}
              leftIcon={<IconArchive className="w-3.5 h-3.5 text-[var(--color-muted)]" />}
            >
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile & Contact Details */}
        <Card className="border border-[var(--color-border)]">
          <CardHeader className="py-3 px-5 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <IconCoffee className="w-4 h-4 text-[var(--color-primary)]" />
              <CardTitle className="text-sm">Tenant Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Slug:</span>
              <span className="font-mono font-medium">/{cafe.slug}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Contact Email:</span>
              <span className="font-medium">{cafe.contactEmail || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Phone:</span>
              <span className="font-medium">{cafe.phone || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Currency & Timezone:</span>
              <span className="font-medium">
                {cafe.currency} • {cafe.timezone}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--color-muted)]">Address:</span>
              <span className="font-medium text-right max-w-xs">{cafe.address || "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Current Subscription Card */}
        <Card className="border border-[var(--color-border)]">
          <CardHeader className="py-3 px-5 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <IconCalendar className="w-4 h-4 text-[var(--color-primary)]" />
              <CardTitle className="text-sm">Active Subscription</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Assigned Plan:</span>
              <span className="font-bold text-[var(--color-primary)]">
                {plan?.name || "No Plan"} (₹{plan?.monthlyPrice || 0}/mo)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Billing Cycle:</span>
              <span className="font-medium">{subscription?.billingCycle || "MONTHLY"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Expiry Date:</span>
              <span className="font-semibold font-mono">
                {subscription?.expiresAt
                  ? new Date(subscription.expiresAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-muted)]">Grace Period:</span>
              <span className="font-medium">{subscription?.gracePeriodDays || 7} days</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--color-muted)]">Calculated Access State:</span>
              <CafeStatusBadge accessState={accessState} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members & Staff Table */}
      <Card className="border border-[var(--color-border)]">
        <CardHeader className="py-3 px-5 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <IconUser className="w-4 h-4 text-[var(--color-muted)]" />
            <CardTitle className="text-sm">Tenant Memberships ({members.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tenant Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m: any) => (
                <TableRow key={m.membership.id}>
                  <TableCell className="font-semibold">{m.user.name}</TableCell>
                  <TableCell className="text-[var(--color-muted)]">{m.user.email}</TableCell>
                  <TableCell>
                    <Badge variant={m.membership.role === "OWNER" ? "primary" : "neutral"}>
                      {m.membership.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.membership.isActive ? "active" : "archived"}>
                      {m.membership.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[var(--color-muted)]">
                    {new Date(m.membership.createdAt).toLocaleDateString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Offline Payments History for this Café */}
      <Card className="border border-[var(--color-border)]">
        <CardHeader className="py-3 px-5 flex items-center justify-between border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <IconReceipt className="w-4 h-4 text-[var(--color-primary)]" />
            <CardTitle className="text-sm">
              Offline Payment Records ({recentPayments.length})
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPaymentModalOpen(true)}
            leftIcon={<IconReceipt className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
          >
            Record Payment
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentPayments.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--color-muted)]">
              No offline payments recorded for this café yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference / Txn ID</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-[var(--color-foreground)] font-mono">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary">{p.paymentMethod}</Badge>
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
                    <TableCell className="text-xs text-[var(--color-muted)]">
                      {p.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentForm
          isOpen={true}
          onClose={() => setIsPaymentModalOpen(false)}
          cafeId={cafe.id}
          cafeName={cafe.name}
          subscriptionId={subscription?.id}
          onSuccess={() => {
            toast.success("Payment recorded successfully.");
            fetchCafeDetails();
          }}
        />
      )}

      {/* Suspend / Reactivate / Archive Dialog */}
      {statusConfirmAction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setStatusConfirmAction(null)}
          onConfirm={handleStatusChange}
          title={
            statusConfirmAction === "SUSPEND"
              ? `Suspend Café "${cafe.name}"?`
              : statusConfirmAction === "REACTIVATE"
              ? `Reactivate Café "${cafe.name}"?`
              : `Archive Café "${cafe.name}"?`
          }
          description={
            statusConfirmAction === "SUSPEND"
              ? "Suspending will block the café owner, staff dashboard, and public menu operations immediately. Super Admin retains full administrative access."
              : statusConfirmAction === "REACTIVATE"
              ? "Reactivating will grant immediate access back to the owner, staff dashboard, and public menu."
              : "Archiving will preserve business records under soft delete semantics while disabling tenant operations."
          }
          variant={statusConfirmAction === "REACTIVATE" ? "primary" : "danger"}
          confirmText={
            statusConfirmAction === "SUSPEND"
              ? "Suspend Tenant"
              : statusConfirmAction === "REACTIVATE"
              ? "Reactivate Tenant"
              : "Archive Tenant"
          }
          isLoading={isMutatingStatus}
        />
      )}
    </div>
  );
}
