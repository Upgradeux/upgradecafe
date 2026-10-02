"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "@/features/super-admin/components/AdminHeader";
import { PlanTable } from "@/features/super-admin/components/PlanTable";
import { PlanForm } from "@/features/super-admin/components/PlanForm";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Plan } from "@/lib/db/schema/plans";
import { IconPlus } from "@tabler/icons-react";

export default function AdminPlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      if (data.success) {
        setPlans(data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load SaaS plans");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleToggleActive = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      if (res.ok) {
        toast.success(`Plan ${plan.name} updated.`);
        fetchPlans();
      } else {
        toast.error("Failed to update plan status.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <AdminHeader
          title="SaaS Plans & Pricing"
          subtitle="Configure pricing tiers, branch allocations, and item limits."
        />
        <Button
          size="sm"
          onClick={() => {
            setEditingPlan(null);
            setIsFormOpen(true);
          }}
          leftIcon={<IconPlus className="w-3.5 h-3.5" />}
        >
          Create Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-xs text-[var(--color-muted)]">
          Loading SaaS plans...
        </div>
      ) : (
        <PlanTable
          plans={plans}
          onEdit={(plan) => {
            setEditingPlan(plan);
            setIsFormOpen(true);
          }}
          onToggleActive={handleToggleActive}
        />
      )}

      {isFormOpen && (
        <PlanForm
          isOpen={true}
          onClose={() => setIsFormOpen(false)}
          plan={editingPlan}
          onSuccess={() => {
            toast.success(editingPlan ? "Plan updated." : "New plan created.");
            fetchPlans();
          }}
        />
      )}
    </div>
  );
}
