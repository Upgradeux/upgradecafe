import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { cafes } from "./cafes";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(), // 'ADMIN_CREATED_CAFE' | 'ADMIN_UPDATED_CAFE' | 'ADMIN_ADDED_PAYMENT' | etc.
    entityType: text("entity_type").notNull(), // 'CAFE' | 'SUBSCRIPTION' | 'PAYMENT' | 'PLAN' | etc.
    entityId: text("entity_id").notNull(),
    cafeId: uuid("cafe_id").references(() => cafes.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_actor_idx").on(table.actorUserId),
    index("audit_logs_cafe_id_idx").on(table.cafeId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
