"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminHeader } from "@/features/super-admin/components/AdminHeader";
import { DashboardStats } from "@/features/super-admin/components/DashboardStats";
import { ExpiringCafesList } from "@/features/super-admin/components/ExpiringCafesList";
import { PaymentForm } from "@/features/super-admin/components/PaymentForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CafeStatusBadge } from "@/features/super-admin/components/CafeStatusBadge";
import { CafeListItem } from "@/features/super-admin/services/cafe-admin.service";
import { ActivityLogItem } from "@/features/super-admin/services/activity-admin.service";
import {
  IconCoffee,
  IconHistory,
  IconArrowUpRight,
} from "@tabler/icons-react";

export default function AdminDashboardPage() {
  const [activity, setActivity] = useState<ActivityLogItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [cafeMetrics, setCafeMetrics] = useState({ totalCafes: 0, activeCafes: 0, graceCafes: 0, suspendedCafes: 0 });
  const [recentlyAdded, setRecentlyAdded] = useState<CafeListItem[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<CafeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Payment Form Modal state
  const [selectedCafeForPayment, setSelectedCafeForPayment] = useState<CafeListItem | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result?.error?.message || "Failed to load dashboard data.");
      }

      const data = result.data;
      setCafeMetrics({
        totalCafes: data.totalCafes,
        activeCafes: data.activeCafes,
        graceCafes: data.graceCafes,
        suspendedCafes: data.suspendedCafes,
      });
      setRecentlyAdded(data.recentlyAdded || []);
      setExpiringSoon(data.expiringCafes || []);
      setActivity(data.activity || []);
      setTotalRevenue(data.totalRevenue || 0);
      setLoadError(null);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setLoadError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <AdminHeader
        title="Platform overview"
        subtitle="Current café, subscription, payment, and activity data."
      />

      {isLoading ? (
        <div className="p-12 text-center text-xs text-[var(--color-muted)] border border-[var(--color-border)] rounded-[var(--radius-card)] bg-[var(--color-surface)]">
          Loading platform metrics...
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-light)] p-4 text-sm text-[var(--color-danger)]">
          {loadError}
        </div>
      ) : (
        <>
          {/* KPI Stats Block */}
          <DashboardStats
            totalCafes={cafeMetrics.totalCafes}
            activeCafes={cafeMetrics.activeCafes}
            graceCafes={cafeMetrics.graceCafes}
            suspendedCafes={cafeMetrics.suspendedCafes}
            totalRevenue={totalRevenue}
          />

      {/* 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added Cafés */}
        <Card className="border border-[var(--color-border)] h-full flex flex-col">
          <CardHeader className="py-3.5 px-5 flex items-center justify-between border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <IconCoffee className="w-4 h-4 text-[var(--color-primary)]" />
              <CardTitle className="text-sm">Recently Added Cafés</CardTitle>
            </div>
            <Link
              href="/admin/cafes"
              className="text-xs text-[var(--color-primary)] hover:underline font-medium"
            >
              View all ({cafeMetrics.totalCafes})
            </Link>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-[var(--color-border-subtle)] flex-1">
            {recentlyAdded.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--color-muted)]">
                No cafés registered yet.
              </div>
            ) : (
              recentlyAdded.map((cafe) => (
                <div
                  key={cafe.id}
                  className="p-4 flex items-center justify-between hover:bg-[var(--color-border-subtle)]/40 transition-colors"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/cafes/${cafe.id}`}
                      className="text-xs font-semibold text-[var(--color-foreground)] hover:text-[var(--color-primary)] block truncate"
                    >
                      {cafe.name}
                    </Link>
                    <div className="text-[11px] text-[var(--color-muted)] truncate mt-0.5">
                      /{cafe.slug} • {cafe.planName} • Added {new Date(cafe.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CafeStatusBadge accessState={cafe.accessState} showDaysRemaining={false} />
                    <Link href={`/admin/cafes/${cafe.id}`}>
                      <Button variant="ghost" size="sm" className="px-2">
                        <IconArrowUpRight className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Expiring Soon / Grace Period Cafés */}
        <ExpiringCafesList
          cafes={expiringSoon}
          onRecordPaymentClick={(cafe) => setSelectedCafeForPayment(cafe)}
        />
      </div>

      {/* Recent Platform Activity */}
      <Card className="border border-[var(--color-border)]">
        <CardHeader className="py-3.5 px-5 flex items-center justify-between border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <IconHistory className="w-4 h-4 text-[var(--color-muted)]" />
            <CardTitle className="text-sm">Recent Administrative Activity</CardTitle>
          </div>
          <Link
            href="/admin/activity"
            className="text-xs text-[var(--color-primary)] hover:underline font-medium"
          >
            Audit Trail
          </Link>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-[var(--color-border-subtle)]">
          {activity.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--color-muted)]">
              No audit logs captured yet.
            </div>
          ) : (
            activity.map((log) => (
              <div
                key={log.id}
                className="p-3.5 px-5 flex items-center justify-between text-xs hover:bg-[var(--color-border-subtle)]/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="neutral" size="sm">
                    {log.action.replace("ADMIN_", "")}
                  </Badge>
                  <span className="font-medium text-[var(--color-foreground)] truncate">
                    {log.actorName} on {log.entityType.toLowerCase()}{" "}
                    {log.cafeName ? `(${log.cafeName})` : ""}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--color-muted)] flex-shrink-0 font-mono">
                  {new Date(log.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      </>
      )}

      {/* Offline Payment Recording Modal */}
      {selectedCafeForPayment && (
        <PaymentForm
          isOpen={true}
          onClose={() => setSelectedCafeForPayment(null)}
          cafeId={selectedCafeForPayment.id}
          cafeName={selectedCafeForPayment.name}
          onSuccess={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
