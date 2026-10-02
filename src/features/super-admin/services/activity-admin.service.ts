import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema/audit-logs";
import { users } from "@/lib/db/schema/users";
import { cafes } from "@/lib/db/schema/cafes";
import { eq, desc, count, and } from "drizzle-orm";

export interface ActivityLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  cafeId: string | null;
  cafeName: string | null;
  actorName: string;
  actorEmail: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: Date;
}

export class ActivityAdminService {
  public async listActivityLogs(params: {
    page?: number;
    limit?: number;
    cafeId?: string;
  }): Promise<{
    logs: ActivityLogItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (params.cafeId) {
      conditions.push(eq(auditLogs.cafeId, params.cafeId));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRes] = await db
      .select({ total: count() })
      .from(auditLogs)
      .where(whereClause);

    const total = Number(countRes?.total || 0);
    const totalPages = Math.ceil(total / limit);

    const rows = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        cafeId: auditLogs.cafeId,
        cafeName: cafes.name,
        actorName: users.name,
        actorEmail: users.email,
        metadata: auditLogs.metadata,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.actorUserId, users.id))
      .leftJoin(cafes, eq(auditLogs.cafeId, cafes.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      logs: rows,
      total,
      page,
      totalPages,
    };
  }
}

export const activityAdminService = new ActivityAdminService();
