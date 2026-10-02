"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/features/super-admin/components/AdminHeader";
import { DashboardStats } from "@/features/super-admin/components/DashboardStats";
import { ExpiringCafesList } from "@/features/super-admin/components/ExpiringCafesList";
import { PaymentForm } from "@/features/super-admin/components/PaymentForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CafeStatusBadge } from "@/features/super-admin/components/CafeStatusBadge";
import { CafeListItem } from "@/features/super-admin/services/cafe-admin.service";
import { ActivityLogItem } from "@/features/super-admin/services/activity-admin.service";
import { IconCoffee, IconHistory, IconArrowUpRight } from "@tabler/icons-react";

interface DashboardData {
  cafeMetrics: {
    totalCafes: number;
    activeCafes: number;
    graceCafes: number;
    suspendedCafes: number;
  };
  recentlyAdded: CafeListItem[];
  expiringSoon: CafeListItem[];
  activity: ActivityLogItem[];
  totalRevenue: number;
}

const initialData: DashboardData = {
  cafeMetrics: { totalCafes: 0, activeCafes: 0, graceCafes: 0, suspendedCafes: 0 },
  recentlyAdded: [],
  expiringSoon: [],
  activity: [],
  totalRevenue: 0,
};

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCafeForPayment, setSelectedCafeForPayment] = useState<CafeListItem | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result?.error?.message || "Failed to load dashboard data.");
      }

      const data = result.data;
      setDashboard({
        cafeMetrics: {
          totalCafes: data.totalCafes,
          activeCafes: data.activeCafes,
          graceCafes: data.graceCafes,
          suspendedCafes: data.suspendedCafes,
        },
        recentlyAdded: data.recentlyAdded || [],
        expiringSoon: data.expiringCafes || [],
        activity: data.activity || [],
        totalRevenue: data.totalRevenue || 0,
      });
      setLoadError(null);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-5">
      <AdminHeader
        title="Platform overview"
        subtitle="Monitor cafes, subscriptions, payments, and recent activity."
      />

      {isLoading ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-10 text-center text-sm text-[var(--color-muted)]">
          Loading platform overview…
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-lg border border-[var(--color-danger)]/25 bg-[var(--color-danger-light)] p-4 text-sm text-[var(--color-danger)]">
          {loadError}
        </div>
      ) : (
        <>
          <DashboardStats
            totalCafes={dashboard.cafeMetrics.totalCafes}
            activeCafes={dashboard.cafeMetrics.activeCafes}
            graceCafes={dashboard.cafeMetrics.graceCafes}
            suspendedCafes={dashboard.cafeMetrics.suspendedCafes}
            totalRevenue={dashboard.totalRevenue}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <IconCoffee className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
                  <CardTitle className="text-sm">Recently added cafes</CardTitle>
                </div>
                <Link href="/admin/cafes" className="shrink-0 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
                  View all <span className="tabular-nums">{dashboard.cafeMetrics.totalCafes}</span>
                </Link>
              </CardHeader>

              <CardContent className="divide-y divide-[var(--color-border-subtle)] p-0">
                {dashboard.recentlyAdded.length === 0 ? (
                  <div className="px-4 py-9 text-center">
                    <p className="text-sm font-medium text-[var(--color-foreground)]">No cafes yet</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">New cafes will appear here.</p>
                  </div>
                ) : (
                  dashboard.recentlyAdded.map((cafe) => (
                    <div key={cafe.id} className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <Link href={`/admin/cafes/${cafe.id}`} className="block truncate text-sm font-medium text-[var(--color-foreground)] hover:underline">
                          {cafe.name}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                          /{cafe.slug} <span aria-hidden="true">·</span> {cafe.planName} <span aria-hidden="true">·</span> Added {new Date(cafe.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <CafeStatusBadge accessState={cafe.accessState} showDaysRemaining={false} />
                        <Link href={`/admin/cafes/${cafe.id}`} aria-label={`Open ${cafe.name}`} className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-foreground)]">
                          <IconArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <ExpiringCafesList
              cafes={dashboard.expiringSoon}
              onRecordPaymentClick={setSelectedCafeForPayment}
            />
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <IconHistory className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                <CardTitle className="text-sm">Recent activity</CardTitle>
              </div>
              <Link href="/admin/activity" className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
                View audit log
              </Link>
            </CardHeader>

            <CardContent className="divide-y divide-[var(--color-border-subtle)] p-0">
              {dashboard.activity.length === 0 ? (
                <div className="px-4 py-9 text-center">
                  <p className="text-sm font-medium text-[var(--color-foreground)]">No activity yet</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">Platform actions will be recorded here.</p>
                </div>
              ) : (
                dashboard.activity.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Badge variant="neutral" size="sm" className="shrink-0">
                        {log.action.replace("ADMIN_", "")}
                      </Badge>
                      <p className="truncate text-xs text-[var(--color-foreground)]">
                        <span className="font-medium">{log.actorName}</span> on {log.entityType.toLowerCase()}{log.cafeName ? ` · ${log.cafeName}` : ""}
                      </p>
                    </div>
                    <time className="shrink-0 text-[11px] tabular-nums text-[var(--color-muted)] sm:text-right">
                      {new Date(log.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      {selectedCafeForPayment && (
        <PaymentForm
          isOpen
          onClose={() => setSelectedCafeForPayment(null)}
          cafeId={selectedCafeForPayment.id}
          cafeName={selectedCafeForPayment.name}
          onSuccess={() => {
            void fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
