import { z } from "zod";

export const recordPaymentSchema = z.object({
  cafeId: z.string().uuid("Invalid café ID"),
  subscriptionId: z.string().uuid("Invalid subscription ID").optional().nullable(),
  amount: z.number().int().positive("Payment amount must be greater than 0"),
  currency: z.string().default("INR"),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"]),
  paymentDate: z.string().or(z.date()),
  referenceNumber: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  // Optionally extend subscription expiry automatically on recording payment
  extendSubscriptionDays: z.number().int().min(0).optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
