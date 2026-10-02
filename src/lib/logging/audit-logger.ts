import { db } from "@/lib/db";
import { auditLogs, NewAuditLog } from "@/lib/db/schema/audit-logs";

export interface LogAuditOptions {
  actorUserId: string;
  action:
    | "ADMIN_CREATED_CAFE"
    | "ADMIN_UPDATED_CAFE"
    | "ADMIN_CHANGED_PLAN"
    | "ADMIN_CHANGED_EXPIRY"
    | "ADMIN_ADDED_PAYMENT"
    | "ADMIN_SUSPENDED_CAFE"
    | "ADMIN_REACTIVATED_CAFE"
    | "ADMIN_ARCHIVED_CAFE"
    | "ADMIN_SETTINGS_UPDATED";
  entityType: "CAFE" | "SUBSCRIPTION" | "PAYMENT" | "PLAN" | "SETTING";
  entityId: string;
  cafeId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Audit Logger Service
 * Authoritatively persists administrative mutations to PostgreSQL.
 * Strips any sensitive properties automatically.
 */
export async function logAuditEvent(options: LogAuditOptions): Promise<void> {
  try {
    const sanitizedMetadata = sanitizeMetadata(options.metadata || {});

    const logEntry: NewAuditLog = {
      actorUserId: options.actorUserId,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      cafeId: options.cafeId ?? null,
      metadata: sanitizedMetadata,
      ipAddress: options.ipAddress ?? null,
      userAgent: options.userAgent ?? null,
    };

    await db.insert(auditLogs).values(logEntry);
  } catch (err) {
    // Audit log failure should be captured in server logs without crashing user flow
    console.error("Failed to write audit log event:", err);
  }
}

/**
 * Filter out sensitive parameters like passwords, tokens, API keys
 */
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ["password", "token", "secret", "authorization", "apiKey", "creditCard"];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
