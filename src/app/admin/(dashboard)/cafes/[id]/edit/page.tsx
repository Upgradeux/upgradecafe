"use client";

import React, { useState, useEffect, use } from "react";
import { AdminHeader } from "@/features/super-admin/components/AdminHeader";
import { CafeForm } from "@/features/super-admin/components/CafeForm";
import { Plan } from "@/lib/db/schema/plans";

export default function EditCafePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [cafeRes, plansRes] = await Promise.all([
          fetch(`/api/admin/cafes/${id}`),
          fetch(`/api/admin/plans`),
        ]);

        const cafeJson = await cafeRes.json();
        const plansJson = await plansRes.json();

        if (cafeJson.success) setData(cafeJson.data);
        if (plansJson.success) setPlans(plansJson.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading || !data) {
    return (
      <div className="p-12 text-center text-xs text-[var(--color-muted)]">
        Loading café details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Edit Café: ${data.cafe.name}`}
        subtitle="Update tenant metadata, contact information, currency, and timezone."
      />

      <CafeForm
        plans={plans}
        initialData={data.cafe}
        isEdit={true}
      />
    </div>
  );
}
