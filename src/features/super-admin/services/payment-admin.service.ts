import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema/payments";
import { subscriptions } from "@/lib/db/schema/subscriptions";
import { cafes } from "@/lib/db/schema/cafes";
import { users } from "@/lib/db/schema/users";
import { eq, and, desc, count, sum } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import { logAuditEvent } from "@/lib/logging/audit-logger";
import { RecordPaymentInput } from "../schemas/payment.schema";

export interface ListPaymentsParams {
  cafeId?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

export interface PaymentListItem {
  id: string;
  cafeId: string;
  cafeName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: Date;
  referenceNumber: string | null;
  notes: string | null;
  recordedByName: string;
  createdAt: Date;
}

export class PaymentAdminService {
  /**
   * Records an offline payment transaction and updates subscription expiry if needed.
   */
  public async recordOfflinePayment(
    input: RecordPaymentInput,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // 1. Verify cafe existence
    const [cafe] = await db
      .select({ id: cafes.id, name: cafes.name })
      .from(cafes)
      .where(eq(cafes.id, input.cafeId))
      .limit(1);

    if (!cafe) {
      throw new AppError({
        code: "CAFE_NOT_FOUND",
        message: "Café not found",
        statusCode: 404,
      });
    }

    return await db.transaction(async (tx) => {
      // Step A: Insert Payment Record
      const [newPayment] = await tx
        .insert(payments)
        .values({
          cafeId: input.cafeId,
          subscriptionId: input.subscriptionId ?? null,
          amount: input.amount,
          currency: input.currency || "INR",
          paymentMethod: input.paymentMethod,
          paymentDate: new Date(input.paymentDate),
          referenceNumber: input.referenceNumber || null,
          notes: input.notes || null,
          recordedByUserId: actorUserId,
        })
        .returning();

      // Step B: Automatically extend subscription if requested
      if (input.extendSubscriptionDays && input.extendSubscriptionDays > 0) {
        const [sub] = await tx
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.cafeId, input.cafeId))
          .orderBy(desc(subscriptions.createdAt))
          .limit(1);

        if (sub) {
          const currentExpiry = new Date(sub.expiresAt);
          const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
          const newExpiresAt = new Date(
            baseDate.getTime() + input.extendSubscriptionDays * 24 * 60 * 60 * 1000
          );

          await tx
            .update(subscriptions)
            .set({
              expiresAt: newExpiresAt,
              status: "ACTIVE",
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, sub.id));
        }
      }

      // Step C: Log audit trail
      await logAuditEvent({
        actorUserId,
        action: "ADMIN_ADDED_PAYMENT",
        entityType: "PAYMENT",
        entityId: newPayment.id,
        cafeId: input.cafeId,
        metadata: {
          amount: input.amount,
          currency: input.currency,
          paymentMethod: input.paymentMethod,
          referenceNumber: input.referenceNumber,
          extendedDays: input.extendSubscriptionDays,
        },
        ipAddress,
        userAgent,
      });

      return newPayment;
    });
  }

  /**
   * Paginated list of offline payments
   */
  public async listPayments(params: ListPaymentsParams): Promise<{
    payments: PaymentListItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 15));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (params.cafeId) {
      conditions.push(eq(payments.cafeId, params.cafeId));
    }
    if (params.paymentMethod && params.paymentMethod !== "ALL") {
      conditions.push(eq(payments.paymentMethod, params.paymentMethod));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalCount] = await db
      .select({ total: count() })
      .from(payments)
      .where(whereClause);

    const total = Number(totalCount?.total || 0);
    const totalPages = Math.ceil(total / limit);

    const rows = await db
      .select({
        id: payments.id,
        cafeId: payments.cafeId,
        cafeName: cafes.name,
        amount: payments.amount,
        currency: payments.currency,
        paymentMethod: payments.paymentMethod,
        paymentDate: payments.paymentDate,
        referenceNumber: payments.referenceNumber,
        notes: payments.notes,
        recordedByName: users.name,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(cafes, eq(payments.cafeId, cafes.id))
      .innerJoin(users, eq(payments.recordedByUserId, users.id))
      .where(whereClause)
      .orderBy(desc(payments.paymentDate))
      .limit(limit)
      .offset(offset);

    return {
      payments: rows,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Computes offline billing KPIs
   */
  public async getPaymentTotals() {
    const [revenueRes] = await db
      .select({
        totalRevenue: sum(payments.amount),
        totalTransactions: count(),
      })
      .from(payments);

    return {
      totalRevenue: Number(revenueRes?.totalRevenue || 0),
      totalTransactions: Number(revenueRes?.totalTransactions || 0),
    };
  }
}

export const paymentAdminService = new PaymentAdminService();
