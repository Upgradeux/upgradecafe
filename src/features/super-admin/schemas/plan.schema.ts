import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(250).optional(),
  monthlyPrice: z.number().int().min(0, "Monthly price cannot be negative"),
  yearlyPrice: z.number().int().min(0, "Yearly price cannot be negative"),
  lifetimePrice: z.number().int().min(0, "Lifetime price cannot be negative"),
  maxBranches: z.number().int().min(1).default(1),
  maxMenuItems: z.number().int().min(1).default(100),
  isActive: z.boolean().default(true),
  features: z.array(z.string()).default([]),
});

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
