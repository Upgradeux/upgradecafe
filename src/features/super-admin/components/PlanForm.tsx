"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Plan } from "@/lib/db/schema/plans";

export interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: Plan | null;
  onSuccess: () => void;
}

export const PlanForm: React.FC<PlanFormModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("999");
  const [yearlyPrice, setYearlyPrice] = useState("9999");
  const [lifetimePrice, setLifetimePrice] = useState("0");
  const [maxBranches, setMaxBranches] = useState("1");
  const [maxMenuItems, setMaxMenuItems] = useState("100");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setSlug(plan.slug);
      setDescription(plan.description || "");
      setMonthlyPrice(plan.monthlyPrice.toString());
      setYearlyPrice(plan.yearlyPrice.toString());
      setLifetimePrice(plan.lifetimePrice.toString());
      setMaxBranches(plan.maxBranches.toString());
      setMaxMenuItems(plan.maxMenuItems.toString());
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setMonthlyPrice("999");
      setYearlyPrice("9999");
      setLifetimePrice("0");
      setMaxBranches("1");
      setMaxMenuItems("100");
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const url = plan ? `/api/admin/plans/${plan.id}` : "/api/admin/plans";
      const method = plan ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          monthlyPrice: parseInt(monthlyPrice, 10),
          yearlyPrice: parseInt(yearlyPrice, 10),
          lifetimePrice: parseInt(lifetimePrice, 10),
          maxBranches: parseInt(maxBranches, 10),
          maxMenuItems: parseInt(maxMenuItems, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to save plan");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={plan ? "Edit SaaS Plan" : "Create New SaaS Plan"}
      description="Configure pricing, branch limits, and operational tiers."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs rounded-[var(--radius-button)] bg-[var(--color-danger-light)] text-[var(--color-danger)] font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Plan Name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!plan) {
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")
                );
              }
            }}
            placeholder="e.g. Growth"
          />

          <Input
            label="Plan Slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. growth"
          />
        </div>

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Summary of target business size and features..."
          rows={2}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Monthly (₹)"
            type="number"
            min="0"
            required
            value={monthlyPrice}
            onChange={(e) => setMonthlyPrice(e.target.value)}
          />
          <Input
            label="Yearly (₹)"
            type="number"
            min="0"
            required
            value={yearlyPrice}
            onChange={(e) => setYearlyPrice(e.target.value)}
          />
          <Input
            label="Lifetime (₹)"
            type="number"
            min="0"
            value={lifetimePrice}
            onChange={(e) => setLifetimePrice(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Max Branches"
            type="number"
            min="1"
            required
            value={maxBranches}
            onChange={(e) => setMaxBranches(e.target.value)}
          />
          <Input
            label="Max Menu Items"
            type="number"
            min="1"
            required
            value={maxMenuItems}
            onChange={(e) => setMaxMenuItems(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-subtle)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            {plan ? "Update Plan" : "Create Plan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
