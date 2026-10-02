"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeId: string;
  cafeName: string;
  subscriptionId?: string | null;
  onSuccess: () => void;
}

export const PaymentForm: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  cafeId,
  cafeName,
  subscriptionId,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>("1200");
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [extendDays, setExtendDays] = useState<string>("30");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const parsedAmount = parseInt(amount, 10);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Please enter a valid payment amount.");
      }

      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafeId,
          subscriptionId: subscriptionId || undefined,
          amount: parsedAmount,
          currency: "INR",
          paymentMethod,
          paymentDate,
          referenceNumber,
          notes,
          extendSubscriptionDays: extendDays ? parseInt(extendDays, 10) : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to record payment");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Offline Payment"
      description={`Record an administrative payment manually collected for ${cafeName}.`}
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
            label="Amount (₹)"
            type="number"
            min="1"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 1200"
          />

          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: "UPI", label: "UPI (GPay / PhonePe / Paytm)" },
              { value: "BANK_TRANSFER", label: "Bank Transfer (NEFT / IMPS)" },
              { value: "CASH", label: "Cash" },
              { value: "CARD", label: "Credit / Debit Card" },
              { value: "OTHER", label: "Other" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Payment Date"
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />

          <Input
            label="Reference / Transaction ID"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. UPI-123891041"
          />
        </div>

        <Select
          label="Auto-Extend Subscription"
          value={extendDays}
          onChange={(e) => setExtendDays(e.target.value)}
          helperText="Extends subscription expiry date and restores active status."
          options={[
            { value: "0", label: "Do not extend (record payment only)" },
            { value: "30", label: "Extend by 30 days (1 month)" },
            { value: "90", label: "Extend by 90 days (3 months)" },
            { value: "365", label: "Extend by 365 days (1 year)" },
          ]}
        />

        <Textarea
          label="Internal Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Collected via cash at branch meeting..."
          rows={2}
        />

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border-subtle)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            Save Payment Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
