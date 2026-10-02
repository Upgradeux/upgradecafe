import { db } from "@/lib/db";
import { subscriptions, Subscription } from "@/lib/db/schema/subscriptions";
import { cafes } from "@/lib/db/schema/cafes";
import { plans } from "@/lib/db/schema/plans";
import { eq, desc, count, and } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import { logAuditEvent } from "@/lib/logging/audit-logger";

export interface SubscriptionListItem {
  id: string;
  cafeId: string;
  cafeName: string;
  planId: string;
  planName: string;
  status: string;
  billingCycle: string;
  startsAt: Date;
  expiresAt: Date;
  gracePeriodDays: number;
  notes: string | null;
  createdAt: Date;
}

export class SubscriptionAdminService {
  public async listSubscriptions(params: { page?: number; limit?: number; status?: string }): Promise<{
    subscriptions: SubscriptionListItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 15));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (params.status && params.status !== "ALL") {
      conditions.push(eq(subscriptions.status, params.status));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRes] = await db
      .select({ total: count() })
      .from(subscriptions)
      .where(whereClause);

    const total = Number(countRes?.total || 0);
    const totalPages = Math.ceil(total / limit);

    const rows = await db
      .select({
        id: subscriptions.id,
        cafeId: subscriptions.cafeId,
        cafeName: cafes.name,
        planId: subscriptions.planId,
        planName: plans.name,
        status: subscriptions.status,
        billingCycle: subscriptions.billingCycle,
        startsAt: subscriptions.startsAt,
        expiresAt: subscriptions.expiresAt,
        gracePeriodDays: subscriptions.gracePeriodDays,
        notes: subscriptions.notes,
        createdAt: subscriptions.createdAt,
      })
      .from(subscriptions)
      .innerJoin(cafes, eq(subscriptions.cafeId, cafes.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(whereClause)
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      subscriptions: rows,
      total,
      page,
      totalPages,
    };
  }

  public async updateSubscription(
    id: string,
    input: {
      planId?: string;
      expiresAt?: string | Date;
      gracePeriodDays?: number;
      status?: string;
      notes?: string;
    },
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Subscription> {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (!sub) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Subscription not found",
        statusCode: 404,
      });
    }

    const updateData: Partial<Subscription> = {
      updatedAt: new Date(),
    };

    if (input.planId) updateData.planId = input.planId;
    if (input.expiresAt) updateData.expiresAt = new Date(input.expiresAt);
    if (input.gracePeriodDays !== undefined) updateData.gracePeriodDays = input.gracePeriodDays;
    if (input.status) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const [updated] = await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, id))
      .returning();

    await logAuditEvent({
      actorUserId,
      action: input.planId && input.planId !== sub.planId ? "ADMIN_CHANGED_PLAN" : "ADMIN_CHANGED_EXPIRY",
      entityType: "SUBSCRIPTION",
      entityId: id,
      cafeId: sub.cafeId,
      metadata: { changedFields: Object.keys(input) },
      ipAddress,
      userAgent,
    });

    return updated;
  }
}

export const subscriptionAdminService = new SubscriptionAdminService();
