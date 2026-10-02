import { z } from "zod";

export const createCafeSchema = z.object({
  name: z.string().trim().min(2, "Café name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional(),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  currency: z.string().default("INR"),
  timezone: z.string().default("Asia/Kolkata"),
  
  // Owner details for initial provision
  ownerName: z.string().trim().min(2, "Owner name must be at least 2 characters"),
  ownerEmail: z.string().trim().toLowerCase().email("Invalid owner email address"),

  // Subscription initial assignment
  planId: z.string().min(1, "Plan selection is required"),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "LIFETIME", "CUSTOM"]).default("MONTHLY"),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const updateCafeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(500).optional().nullable(),
  contactEmail: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(20).optional().or(z.literal("")).nullable(),
  address: z.string().max(300).optional().or(z.literal("")).nullable(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  logoKey: z.string().optional().nullable(),
  coverKey: z.string().optional().nullable(),
});

export const updateCafeStatusSchema = z.object({
  action: z.enum(["SUSPEND", "REACTIVATE", "ARCHIVE", "RESET_OVERRIDE"]),
  reason: z.string().max(300).optional(),
});

export type CreateCafeInput = z.infer<typeof createCafeSchema>;
export type UpdateCafeInput = z.infer<typeof updateCafeSchema>;
export type UpdateCafeStatusInput = z.infer<typeof updateCafeStatusSchema>;
