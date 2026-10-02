import { Order, OrderItem, ServiceRequest } from "@/lib/db/schema/orders";
import { Table } from "@/lib/db/schema/tables";

export type OrderStatus =
  | "NEW"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COMPLETED"
  | "CANCELLED";

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

export type PaymentStatus =
  | "UNPAID"
  | "PENDING_VERIFICATION"
  | "PAID"
  | "PAYMENT_REJECTED"
  | "REFUNDED";

export type PaymentMethod = "CASH" | "UPI" | "CARD";

export type ServiceRequestType =
  | "CALL_WAITER"
  | "NEED_WATER"
  | "REQUEST_BILL"
  | "CUSTOM";

export type ServiceRequestStatus = "PENDING" | "ACKNOWLEDGED";

export interface OrderItemWithDetails extends OrderItem {
  preparationTimeMinutes?: number | null;
}

export interface OrderWithItems extends Omit<Order, "paymentVerifiedAt" | "paymentRejectedAt"> {
  paymentVerifiedAt?: Date | null;
  paymentRejectedAt?: Date | null;
  items: OrderItemWithDetails[];
  table?: Table | null;
}

export interface OrderStatsSummary {
  activeCount: number;
  newCount: number;
  preparingCount: number;
  readyCount: number;
  servedCount: number;
  completedTodayCount: number;
  estimatedRevenueToday: number;
  pendingServiceRequestsCount: number;
}

export interface OrderFilterParams {
  search?: string;
  orderType?: "ALL" | OrderType;
  paymentStatus?: "ALL" | PaymentStatus;
  status?: "ALL" | OrderStatus;
  tableId?: string;
  date?: string;
}

export interface CreateOrderItemInput {
  menuItemId?: string | null;
  itemName: string;
  unitPrice: number;
  quantity: number;
  variantName?: string | null;
  specialInstructions?: string | null;
}

export interface CreateOrderInput {
  orderType: OrderType;
  tableId?: string | null;
  tableNameSnapshot?: string | null;
  tableQrIdentifier?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerId?: string | null;
  guestSessionId?: string | null;
  items: CreateOrderItemInput[];
  notes?: string | null;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  discount?: number;
  guestCount?: number | null;
  existingOrderIdToAppend?: string | null;
}
