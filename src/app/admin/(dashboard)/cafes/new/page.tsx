"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/features/super-admin/components/AdminHeader";
import { CafeForm } from "@/features/super-admin/components/CafeForm";
import { Plan } from "@/lib/db/schema/plans";

export default function NewCafePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/admin/plans?activeOnly=true");
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data?.error?.message || "Failed to load active plans.");
        }
        setPlans(data.data || []);
      } catch (err) {
        console.error("Failed to load plans:", err);
        setLoadError(err instanceof Error ? err.message : "Failed to load plans.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Provision New Café Tenant"
        subtitle="Atomically creates café record, initial owner user, tenant membership, and initial subscription."
      />

      {isLoading ? (
        <div className="p-10 text-center text-xs text-[var(--color-muted)]">
          Loading SaaS plans...
        </div>
      ) : (
        loadError ? (
          <div role="alert" className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-light)] p-4 text-sm text-[var(--color-danger)]">
            {loadError}
          </div>
        ) : (
          <CafeForm plans={plans} />
        )
      )}
    </div>
  );
}
