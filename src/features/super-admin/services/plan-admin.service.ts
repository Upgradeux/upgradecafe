import { db } from "@/lib/db";
import { plans, NewPlan, Plan } from "@/lib/db/schema/plans";
import { eq, desc } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import { logAuditEvent } from "@/lib/logging/audit-logger";
import { CreatePlanInput, UpdatePlanInput } from "../schemas/plan.schema";

export class PlanAdminService {
  public async listPlans(activeOnly = false): Promise<Plan[]> {
    return activeOnly
      ? await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(desc(plans.createdAt))
      : await db.select().from(plans).orderBy(desc(plans.createdAt));
  }

  public async getPlanById(id: string): Promise<Plan> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
    if (!plan) {
      throw new AppError({
        code: "PLAN_NOT_FOUND",
        message: "Plan not found",
        statusCode: 404,
      });
    }
    return plan;
  }

  public async createPlan(
    input: CreatePlanInput,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Plan> {
    const [existing] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.slug, input.slug))
      .limit(1);

    if (existing) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: `Plan with slug '${input.slug}' already exists.`,
        statusCode: 409,
      });
    }

    const [created] = await db
      .insert(plans)
      .values(input as NewPlan)
      .returning();

    await logAuditEvent({
      actorUserId,
      action: "ADMIN_CHANGED_PLAN",
      entityType: "PLAN",
      entityId: created.id,
      metadata: { planName: created.name, slug: created.slug },
      ipAddress,
      userAgent,
    });

    return created;
  }

  public async updatePlan(
    id: string,
    input: UpdatePlanInput,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Plan> {
    const [existing] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
    if (!existing) {
      throw new AppError({
        code: "PLAN_NOT_FOUND",
        message: "Plan not found",
        statusCode: 404,
      });
    }

    const [updated] = await db
      .update(plans)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, id))
      .returning();

    await logAuditEvent({
      actorUserId,
      action: "ADMIN_CHANGED_PLAN",
      entityType: "PLAN",
      entityId: id,
      metadata: { updatedFields: Object.keys(input) },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  public async togglePlanActive(
    id: string,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Plan> {
    const existing = await this.getPlanById(id);
    return await this.updatePlan(
      id,
      { isActive: !existing.isActive },
      actorUserId,
      ipAddress,
      userAgent
    );
  }
}

export const planAdminService = new PlanAdminService();
