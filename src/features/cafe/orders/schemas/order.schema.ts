import { z } from "zod";

export const orderItemInputSchema = z.object({
  menuItemId: z.string().uuid().optional().nullable(),
  itemName: z.string().min(1, "Item name is required").max(120),
  unitPrice: z.coerce.number().int().min(0, "Price cannot be negative"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").default(1),
  variantName: z.string().max(80).optional().nullable(),
  specialInstructions: z.string().max(200).optional().nullable(),
});

export const createOrderSchema = z.object({
  orderType: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]).default("DINE_IN"),
  tableId: z.string().uuid().optional().nullable(),
  tableNameSnapshot: z.string().max(60).optional().nullable(),
  tableQrIdentifier: z.string().max(100).optional().nullable(),
  customerName: z.string().max(80).optional().nullable(),
  customerPhone: z.string().max(20).optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, "Order must have at least one item"),
  notes: z.string().max(400).optional().nullable(),
  paymentStatus: z
    .enum(["UNPAID", "PENDING_VERIFICATION", "PAID", "PAYMENT_REJECTED", "REFUNDED"])
    .default("UNPAID"),
  paymentMethod: z.enum(["CASH", "UPI", "CARD"]).optional().nullable(),
  discount: z.coerce.number().int().min(0).default(0),
  guestCount: z.coerce.number().int().min(1).max(50).optional().nullable(),
  existingOrderIdToAppend: z.string().uuid().optional().nullable(),
  guestSessionId: z.string().uuid().optional().nullable(),
  customerId: z.string().optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["NEW", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"]),
  cancellationReason: z.string().max(300).optional().nullable(),
});

export const updatePaymentSchema = z.object({
  paymentStatus: z.enum([
    "UNPAID",
    "PENDING_VERIFICATION",
    "PAID",
    "PAYMENT_REJECTED",
    "REFUNDED",
  ]),
  paymentMethod: z.enum(["CASH", "UPI", "CARD"]).optional().nullable(),
});

export const createServiceRequestSchema = z.object({
  tableId: z.string().uuid().optional().nullable(),
  tableNameSnapshot: z.string().min(1, "Table identifier is required").max(60),
  requestType: z.enum(["CALL_WAITER", "NEED_WATER", "REQUEST_BILL", "CUSTOM"]),
  notes: z.string().max(200).optional().nullable(),
});

export type CreateOrderInputZod = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInputZod = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentInputZod = z.infer<typeof updatePaymentSchema>;
export type CreateServiceRequestInputZod = z.infer<typeof createServiceRequestSchema>;
