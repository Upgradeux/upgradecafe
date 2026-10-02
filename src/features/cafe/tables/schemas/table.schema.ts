import { z } from "zod";

export const tableSchema = z.object({
  floorId: z.string().uuid().optional().nullable(),
  tableNumber: z.string().min(1, "Table number/name is required").max(50),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1 person").max(50).default(2),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED"]).default("AVAILABLE"),
  currentGuests: z.coerce.number().int().min(0).optional().nullable(),
  occupiedSinceMinutes: z.coerce.number().int().min(0).optional().nullable(),
  currentBillAmount: z.coerce.number().int().min(0).optional().nullable(),
  reservedForTime: z.string().max(50).optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type TableInput = z.infer<typeof tableSchema>;
