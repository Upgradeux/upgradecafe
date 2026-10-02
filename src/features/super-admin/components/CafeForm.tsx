"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Plan } from "@/lib/db/schema/plans";

export interface CafeFormProps {
  plans: Plan[];
  initialData?: any;
  isEdit?: boolean;
}

export const CafeForm: React.FC<CafeFormProps> = ({
  plans,
  initialData,
  isEdit = false,
}) => {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [currency, setCurrency] = useState(initialData?.currency || "INR");
  const [timezone, setTimezone] = useState(initialData?.timezone || "Asia/Kolkata");

  // Owner details (for create)
  const [ownerName, setOwnerName] = useState(initialData?.owner?.name || "");
  const [ownerEmail, setOwnerEmail] = useState(initialData?.owner?.email || "");

  // Subscription initial setup
  const [planId, setPlanId] = useState(
    initialData?.subscription?.planId || (plans[0]?.id ?? "")
  );
  const [billingCycle, setBillingCycle] = useState(
    initialData?.subscription?.billingCycle || "MONTHLY"
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCafe, setCreatedCafe] = useState<{
    id: string;
    name: string;
    slug: string;
    owner: {
      name: string;
      email: string;
      temporaryPassword: string | null;
      passwordChangeRequired: boolean;
    };
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const url = isEdit ? `/api/admin/cafes/${initialData.id}` : "/api/admin/cafes";
      const method = isEdit ? "PATCH" : "POST";

      const payload = isEdit
        ? {
            name,
            slug,
            description,
            contactEmail,
            phone,
            address,
            currency,
            timezone,
          }
        : {
            name,
            slug,
            description,
            contactEmail,
            phone,
            address,
            currency,
            timezone,
            ownerName,
            ownerEmail,
            planId,
            billingCycle,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to save café");
      }

      if (isEdit) {
        router.push(`/admin/cafes/${initialData.id}`);
        router.refresh();
      } else {
        setCreatedCafe({
          ...data.data.cafe,
          owner: data.data.owner,
        });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (createdCafe) {
    return (
      <Card className="max-w-4xl space-y-5 border border-[var(--color-border)] p-6">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-foreground)]">Café created</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {createdCafe.name} is ready at <span className="font-mono">/cafe/{createdCafe.slug}</span>.
          </p>
        </div>

        {createdCafe.owner.temporaryPassword ? (
          <div className="rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning-light)] p-4">
            <div className="text-sm font-semibold text-[var(--color-foreground)]">One-time owner sign-in</div>
            <dl className="mt-3 grid gap-2 text-sm">
              <div><dt className="inline text-[var(--color-muted)]">Email: </dt><dd className="inline font-medium">{createdCafe.owner.email}</dd></div>
              <div><dt className="inline text-[var(--color-muted)]">Temporary password: </dt><dd className="inline select-all font-mono font-semibold">{createdCafe.owner.temporaryPassword}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              Share these details with the owner through a secure channel. The password is not stored in readable form and will not be shown again. The owner must replace it at first sign-in.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-sm text-[var(--color-muted)]">
            {createdCafe.owner.email} already has an account. No password was changed; they should sign in with their existing password.
            {createdCafe.owner.passwordChangeRequired && " Their account will require its existing temporary password to be changed."}
          </div>
        )}

        <Button type="button" onClick={() => router.push(`/admin/cafes/${createdCafe.id}`)}>
          Open café details
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="p-3.5 text-xs rounded-[var(--radius-button)] bg-[var(--color-danger-light)] text-[var(--color-danger)] font-medium">
          {error}
        </div>
      )}

      {/* Café Core Profile */}
      <Card className="border border-[var(--color-border)] p-5">
        <div className="text-sm font-semibold text-[var(--color-foreground)] border-b border-[var(--color-border-subtle)] pb-2.5 mb-4">
          1. Café Profile & Tenant Identity
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Café Name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!isEdit) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "")
                  );
                }
              }}
              placeholder="Enter café name"
            />

            <Input
              label="Tenant Slug (Unique URL identifier)"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="generated-from-cafe-name"
              helperText="Determines future menu URL: /menu/the-roasted-bean"
            />
          </div>

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this café..."
            rows={2}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@example.com"
            />

            <Input
              label="Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          <Input
            label="Physical Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, city, postal code"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: "INR", label: "INR (₹) - Indian Rupee" },
                { value: "USD", label: "USD ($) - US Dollar" },
                { value: "EUR", label: "EUR (€) - Euro" },
                { value: "GBP", label: "GBP (£) - British Pound" },
              ]}
            />

            <Select
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={[
                { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
                { value: "UTC", label: "UTC" },
                { value: "America/New_York", label: "America/New_York (EST)" },
                { value: "Europe/London", label: "Europe/London (GMT)" },
                { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Owner Provisioning (Only on Create) */}
      {!isEdit && (
        <Card className="border border-[var(--color-border)] p-5">
          <div className="text-sm font-semibold text-[var(--color-foreground)] border-b border-[var(--color-border-subtle)] pb-2.5 mb-4">
            2. Owner Account Provisioning
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Owner Full Name"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Owner full name"
            />

            <Input
              label="Owner Email Address"
              type="email"
              required
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="owner@example.com"
              helperText="Will be linked as the OWNER of this tenant."
            />
          </div>
        </Card>
      )}

      {/* Subscription Assignment (Only on Create) */}
      {!isEdit && (
        <Card className="border border-[var(--color-border)] p-5">
          <div className="text-sm font-semibold text-[var(--color-foreground)] border-b border-[var(--color-border-subtle)] pb-2.5 mb-4">
            3. Initial SaaS Plan & Subscription
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                No active plans are available. Create or activate a plan before provisioning a café.
              </p>
            ) : <Select
              label="Initial Plan"
              required
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              options={plans.map((p) => ({
                value: p.id,
                label: `${p.name} (₹${p.monthlyPrice}/mo)`,
              }))}
            />}

            <Select
              label="Billing Cycle"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              options={[
                { value: "MONTHLY", label: "Monthly (30 days)" },
                { value: "YEARLY", label: "Yearly (365 days)" },
                { value: "LIFETIME", label: "Lifetime" },
              ]}
            />
          </div>
        </Card>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} disabled={!isEdit && plans.length === 0}>
          {isEdit ? "Save Changes" : "Provision Café Tenant"}
        </Button>
      </div>
    </form>
  );
};
