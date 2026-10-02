import { db } from "@/lib/db";
import { cafes, NewCafe } from "@/lib/db/schema/cafes";
import { users } from "@/lib/db/schema/users";
import { accounts } from "@/lib/db/schema/auth-tables";
import { cafeMemberships } from "@/lib/db/schema/memberships";
import { subscriptions } from "@/lib/db/schema/subscriptions";
import { plans } from "@/lib/db/schema/plans";
import { payments } from "@/lib/db/schema/payments";
import { auditLogs } from "@/lib/db/schema/audit-logs";
import { eq, and, or, ilike, desc, count } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import { logAuditEvent } from "@/lib/logging/audit-logger";
import { getCafeAccessState, CafeAccessState } from "@/server/services/access-state.service";
import { CreateCafeInput, UpdateCafeInput, UpdateCafeStatusInput } from "../schemas/cafe.schema";
import { hashPassword } from "better-auth/crypto";
import { randomBytes } from "node:crypto";

export interface ListCafesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: "newest" | "oldest" | "name";
}

export interface CafeListItem {
  id: string;
  name: string;
  slug: string;
  contactEmail: string | null;
  phone: string | null;
  status: string;
  manualStatusOverride: string | null;
  createdAt: Date;
  ownerName: string | null;
  ownerEmail: string | null;
  planName: string | null;
  subscriptionExpiresAt: Date | null;
  accessState: CafeAccessState;
  logoKey: string | null;
}

export class CafeAdminService {
  public async getDashboardSummary() {
    const [rawCafes, rawSubscriptions] = await Promise.all([
      db
        .select({
          id: cafes.id,
          name: cafes.name,
          slug: cafes.slug,
          contactEmail: cafes.contactEmail,
          phone: cafes.phone,
          status: cafes.status,
          manualStatusOverride: cafes.manualStatusOverride,
          suspensionReason: cafes.suspensionReason,
          logoKey: cafes.logoKey,
          createdAt: cafes.createdAt,
        })
        .from(cafes)
        .orderBy(desc(cafes.createdAt)),
      db
        .select({
          cafeId: subscriptions.cafeId,
          startsAt: subscriptions.startsAt,
          expiresAt: subscriptions.expiresAt,
          gracePeriodDays: subscriptions.gracePeriodDays,
          status: subscriptions.status,
          planName: plans.name,
          createdAt: subscriptions.createdAt,
        })
        .from(subscriptions)
        .leftJoin(plans, eq(subscriptions.planId, plans.id))
        .orderBy(desc(subscriptions.createdAt)),
    ]);

    const latestSubscriptionByCafe = new Map<string, (typeof rawSubscriptions)[number]>();
    for (const subscription of rawSubscriptions) {
      if (!latestSubscriptionByCafe.has(subscription.cafeId)) {
        latestSubscriptionByCafe.set(subscription.cafeId, subscription);
      }
    }

    const items: CafeListItem[] = rawCafes.map((cafe) => {
      const subscription = latestSubscriptionByCafe.get(cafe.id);
      return {
        id: cafe.id,
        name: cafe.name,
        slug: cafe.slug,
        contactEmail: cafe.contactEmail,
        phone: cafe.phone,
        status: cafe.status,
        manualStatusOverride: cafe.manualStatusOverride,
        createdAt: cafe.createdAt,
        ownerName: null,
        ownerEmail: null,
        planName: subscription?.planName || "No Plan",
        subscriptionExpiresAt: subscription?.expiresAt || null,
        accessState: getCafeAccessState(cafe, subscription || null),
        logoKey: cafe.logoKey,
      };
    });

    const expiringCafes = items
      .filter((cafe) =>
        cafe.accessState.status === "GRACE" ||
        (cafe.accessState.status === "ACTIVE" && cafe.accessState.daysRemainingInPeriod <= 7)
      )
      .sort((a, b) => a.accessState.daysRemainingInPeriod - b.accessState.daysRemainingInPeriod)
      .slice(0, 5);

    return {
      totalCafes: items.length,
      activeCafes: items.filter((cafe) => cafe.accessState.status === "ACTIVE").length,
      graceCafes: items.filter((cafe) => cafe.accessState.status === "GRACE").length,
      suspendedCafes: items.filter((cafe) => cafe.accessState.status === "SUSPENDED").length,
      recentlyAdded: items.slice(0, 5),
      expiringCafes,
    };
  }

  /**
   * Paginated, searchable, status-filtered café list.
   * Performs server-side pagination with calculated access states.
   */
  public async listCafes(params: ListCafesParams): Promise<{
    cafes: CafeListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;

    const whereConditions = [];

    // Search by name, slug, or contact email
    if (params.search) {
      const searchPattern = `%${params.search}%`;
      whereConditions.push(
        or(
          ilike(cafes.name, searchPattern),
          ilike(cafes.slug, searchPattern),
          ilike(cafes.contactEmail, searchPattern)
        )
      );
    }

    const filterClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    const filterByAccessState = Boolean(params.status && params.status !== "ALL");

    let total = 0;
    if (!filterByAccessState) {
      const [countResult] = await db
        .select({ total: count() })
        .from(cafes)
        .where(filterClause);
      total = Number(countResult?.total || 0);
    }

    // Fetch page records
    const cafeQuery = db
      .select({
        id: cafes.id,
        name: cafes.name,
        slug: cafes.slug,
        contactEmail: cafes.contactEmail,
        phone: cafes.phone,
        status: cafes.status,
        manualStatusOverride: cafes.manualStatusOverride,
        suspensionReason: cafes.suspensionReason,
        logoKey: cafes.logoKey,
        createdAt: cafes.createdAt,
      })
      .from(cafes)
      .where(filterClause)
      .orderBy(desc(cafes.createdAt));
    const rawCafes = filterByAccessState
      ? await cafeQuery
      : await cafeQuery.limit(limit).offset(offset);

    const cafeItems: CafeListItem[] = [];

    for (const c of rawCafes) {
      // Find active subscription
      const [sub] = await db
        .select({
          startsAt: subscriptions.startsAt,
          expiresAt: subscriptions.expiresAt,
          gracePeriodDays: subscriptions.gracePeriodDays,
          status: subscriptions.status,
          planName: plans.name,
        })
        .from(subscriptions)
        .leftJoin(plans, eq(subscriptions.planId, plans.id))
        .where(eq(subscriptions.cafeId, c.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      // Find owner user
      const [membership] = await db
        .select({
          ownerName: users.name,
          ownerEmail: users.email,
        })
        .from(cafeMemberships)
        .innerJoin(users, eq(cafeMemberships.userId, users.id))
        .where(
          and(
            eq(cafeMemberships.cafeId, c.id),
            eq(cafeMemberships.role, "OWNER")
          )
        )
        .limit(1);

      const accessState = getCafeAccessState(c, sub);

      cafeItems.push({
        id: c.id,
        name: c.name,
        slug: c.slug,
        contactEmail: c.contactEmail,
        phone: c.phone,
        status: c.status,
        manualStatusOverride: c.manualStatusOverride,
        createdAt: c.createdAt,
        ownerName: membership?.ownerName || null,
        ownerEmail: membership?.ownerEmail || null,
        planName: sub?.planName || "No Plan",
        subscriptionExpiresAt: sub?.expiresAt || null,
        accessState,
        logoKey: c.logoKey || null,
      });
    }

    const matchingCafes = filterByAccessState
      ? cafeItems.filter((cafe) => cafe.accessState.status === params.status)
      : cafeItems;
    if (filterByAccessState) total = matchingCafes.length;
    const totalPages = Math.ceil(total / limit);

    return {
      cafes: filterByAccessState ? matchingCafes.slice(offset, offset + limit) : matchingCafes,
      total,
      page,
      pageSize: limit,
      totalPages,
    };
  }

  /**
   * Retrieves single café by ID with full relationships
   */
  public async getCafeById(id: string) {
    const [cafe] = await db
      .select()
      .from(cafes)
      .where(eq(cafes.id, id))
      .limit(1);

    if (!cafe) {
      throw new AppError({
        code: "CAFE_NOT_FOUND",
        message: "Café not found",
        statusCode: 404,
      });
    }

    // Active subscription & plan
    const [sub] = await db
      .select({
        subscription: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.cafeId, id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    // Memberships & Users
    const members = await db
      .select({
        membership: cafeMemberships,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(cafeMemberships)
      .innerJoin(users, eq(cafeMemberships.userId, users.id))
      .where(eq(cafeMemberships.cafeId, id));

    // Recent Payments
    const recentPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.cafeId, id))
      .orderBy(desc(payments.paymentDate))
      .limit(10);

    const accessState = getCafeAccessState(cafe, sub?.subscription || null);

    return {
      cafe,
      subscription: sub?.subscription || null,
      plan: sub?.plan || null,
      members,
      recentPayments,
      accessState,
    };
  }

  /**
   * Transactional café provisioning.
   * Atomic operations:
   * 1. Validate slug uniqueness
   * 2. Insert Café
   * 3. Insert or reuse Owner User
   * 4. Insert Membership (OWNER)
   * 5. Insert Subscription
   * 6. Log Audit Event
   * Rollback cleanly on error.
   */
  public async createCafeTransactional(
    input: CreateCafeInput,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // 1. Check duplicate slug
    const [existingSlug] = await db
      .select({ id: cafes.id })
      .from(cafes)
      .where(eq(cafes.slug, input.slug))
      .limit(1);

    if (existingSlug) {
      throw new AppError({
        code: "DUPLICATE_SLUG",
        message: `A café with slug '${input.slug}' already exists.`,
        statusCode: 409,
      });
    }

    // 2. Validate plan existence
    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, input.planId), eq(plans.isActive, true)))
      .limit(1);

    if (!plan) {
      throw new AppError({
        code: "PLAN_NOT_FOUND",
        message: "The selected subscription plan does not exist.",
        statusCode: 404,
      });
    }

    // 3. Execute transaction
    return await db.transaction(async (tx) => {
      // Step A: Create Café
      const [newCafe] = await tx
        .insert(cafes)
        .values({
          name: input.name,
          slug: input.slug,
          description: input.description,
          contactEmail: input.contactEmail || input.ownerEmail,
          phone: input.phone,
          address: input.address,
          currency: input.currency || "INR",
          timezone: input.timezone || "Asia/Kolkata",
          status: "ACTIVE",
        })
        .returning();

      // Step B: Resolve or Create Owner User
      let ownerId: string;
      let ownerName = input.ownerName;
      let temporaryPassword: string | null = null;
      let passwordChangeRequired = false;
      const [existingUser] = await tx
        .select({
          id: users.id,
          name: users.name,
          role: users.role,
          mustChangePassword: users.mustChangePassword,
        })
        .from(users)
        .where(eq(users.email, input.ownerEmail.toLowerCase()))
        .limit(1);

      if (existingUser) {
        if (existingUser.role === "SUPER_ADMIN") {
          throw new AppError({
            code: "INVALID_OWNER_ACCOUNT",
            message: "A Super Admin account cannot be assigned as a café owner.",
            statusCode: 409,
          });
        }

        ownerId = existingUser.id;
        ownerName = existingUser.name;
        passwordChangeRequired = existingUser.mustChangePassword;

        const [credentialAccount] = await tx
          .select({ id: accounts.id, password: accounts.password })
          .from(accounts)
          .where(and(eq(accounts.userId, ownerId), eq(accounts.providerId, "credential")))
          .limit(1);

        if (!credentialAccount?.password) {
          temporaryPassword = randomBytes(24).toString("base64url");
          const hashedPassword = await hashPassword(temporaryPassword);
          if (credentialAccount) {
            await tx
              .update(accounts)
              .set({ accountId: ownerId, password: hashedPassword, updatedAt: new Date() })
              .where(eq(accounts.id, credentialAccount.id));
          } else {
            await tx.insert(accounts).values({
              id: crypto.randomUUID(),
              userId: ownerId,
              accountId: ownerId,
              providerId: "credential",
              password: hashedPassword,
            });
          }
          await tx
            .update(users)
            .set({ mustChangePassword: true, updatedAt: new Date() })
            .where(eq(users.id, ownerId));
          passwordChangeRequired = true;
        }
      } else {
        ownerId = crypto.randomUUID();
        temporaryPassword = randomBytes(24).toString("base64url");
        const hashedPassword = await hashPassword(temporaryPassword);
        await tx.insert(users).values({
          id: ownerId,
          name: input.ownerName,
          email: input.ownerEmail.toLowerCase(),
          role: "USER",
          mustChangePassword: true,
        });
        await tx.insert(accounts).values({
          id: crypto.randomUUID(),
          userId: ownerId,
          accountId: ownerId,
          providerId: "credential",
          password: hashedPassword,
        });
        passwordChangeRequired = true;
      }

      // Step C: Create Membership
      await tx.insert(cafeMemberships).values({
        userId: ownerId,
        cafeId: newCafe.id,
        role: "OWNER",
        isActive: true,
      });

      // Step D: Calculate Subscription Dates & Create Subscription
      const now = input.startsAt ? new Date(input.startsAt) : new Date();
      const expiresAt = input.expiresAt
        ? new Date(input.expiresAt)
        : calculateExpiryDate(now, input.billingCycle);

      const [newSub] = await tx
        .insert(subscriptions)
        .values({
          cafeId: newCafe.id,
          planId: plan.id,
          billingCycle: input.billingCycle,
          status: "ACTIVE",
          startsAt: now,
          expiresAt: expiresAt,
          gracePeriodDays: 7,
          notes: `Initial provisioning on plan ${plan.name}`,
        })
        .returning();

      // Step E: Write Audit Log
      await tx.insert(auditLogs).values({
        actorUserId,
        action: "ADMIN_CREATED_CAFE",
        entityType: "CAFE",
        entityId: newCafe.id,
        cafeId: newCafe.id,
        metadata: {
          cafeName: newCafe.name,
          slug: newCafe.slug,
          ownerEmail: input.ownerEmail,
          planName: plan.name,
          billingCycle: input.billingCycle,
        },
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      });

      return {
        cafe: newCafe,
        subscription: newSub,
        owner: {
          id: ownerId,
          name: ownerName,
          email: input.ownerEmail.toLowerCase(),
          temporaryPassword,
          passwordChangeRequired,
        },
      };
    });
  }

  /**
   * Updates café properties
   */
  public async updateCafe(
    id: string,
    input: UpdateCafeInput,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const [existing] = await db
      .select()
      .from(cafes)
      .where(eq(cafes.id, id))
      .limit(1);

    if (!existing) {
      throw new AppError({
        code: "CAFE_NOT_FOUND",
        message: "Café not found",
        statusCode: 404,
      });
    }

    if (input.slug && input.slug !== existing.slug) {
      const [duplicate] = await db
        .select({ id: cafes.id })
        .from(cafes)
        .where(eq(cafes.slug, input.slug))
        .limit(1);

      if (duplicate) {
        throw new AppError({
          code: "DUPLICATE_SLUG",
          message: `Slug '${input.slug}' is already taken.`,
          statusCode: 409,
        });
      }
    }

    const [updated] = await db
      .update(cafes)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(cafes.id, id))
      .returning();

    await logAuditEvent({
      actorUserId,
      action: "ADMIN_UPDATED_CAFE",
      entityType: "CAFE",
      entityId: id,
      cafeId: id,
      metadata: { changedFields: Object.keys(input) },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  /**
   * Manually overrides café status (SUSPEND, REACTIVATE, ARCHIVE)
   */
  public async setCafeStatus(
    id: string,
    input: UpdateCafeStatusInput,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const [cafe] = await db
      .select()
      .from(cafes)
      .where(eq(cafes.id, id))
      .limit(1);

    if (!cafe) {
      throw new AppError({
        code: "CAFE_NOT_FOUND",
        message: "Café not found",
        statusCode: 404,
      });
    }

    let statusUpdate: Partial<NewCafe> = {};
    let auditAction: any = "ADMIN_UPDATED_CAFE";

    if (input.action === "SUSPEND") {
      statusUpdate = {
        status: "SUSPENDED",
        manualStatusOverride: "SUSPENDED",
        suspensionReason: input.reason || "Suspended by Super Admin",
      };
      auditAction = "ADMIN_SUSPENDED_CAFE";
    } else if (input.action === "REACTIVATE") {
      statusUpdate = {
        status: "ACTIVE",
        manualStatusOverride: "ACTIVE",
        suspensionReason: null,
      };
      auditAction = "ADMIN_REACTIVATED_CAFE";
    } else if (input.action === "ARCHIVE") {
      statusUpdate = {
        status: "ARCHIVED",
        manualStatusOverride: null,
        archivedAt: new Date(),
      };
      auditAction = "ADMIN_ARCHIVED_CAFE";
    } else if (input.action === "RESET_OVERRIDE") {
      statusUpdate = {
        manualStatusOverride: null,
        suspensionReason: null,
      };
    }

    const [updated] = await db
      .update(cafes)
      .set({
        ...statusUpdate,
        updatedAt: new Date(),
      })
      .where(eq(cafes.id, id))
      .returning();

    await logAuditEvent({
      actorUserId,
      action: auditAction,
      entityType: "CAFE",
      entityId: id,
      cafeId: id,
      metadata: { action: input.action, reason: input.reason },
      ipAddress,
      userAgent,
    });

    return updated;
  }
}

function calculateExpiryDate(startDate: Date, cycle: string): Date {
  const result = new Date(startDate);
  switch (cycle) {
    case "YEARLY":
      result.setFullYear(result.getFullYear() + 1);
      break;
    case "LIFETIME":
      result.setFullYear(result.getFullYear() + 100);
      break;
    case "MONTHLY":
    default:
      result.setMonth(result.getMonth() + 1);
      break;
  }
  return result;
}

export const cafeAdminService = new CafeAdminService();
