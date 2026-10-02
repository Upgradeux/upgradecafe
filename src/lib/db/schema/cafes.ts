import { pgTable, text, timestamp, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";

export const cafes = pgTable(
  "cafes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    contactEmail: text("contact_email"),
    phone: text("phone"),
    address: text("address"),
    currency: text("currency").default("INR").notNull(),
    timezone: text("timezone").default("Asia/Kolkata").notNull(),
    logoKey: text("logo_key"),
    coverKey: text("cover_key"),
    status: text("status").default("ACTIVE").notNull(), // 'ACTIVE' | 'GRACE' | 'SUSPENDED' | 'ARCHIVED'
    manualStatusOverride: text("manual_status_override"), // 'ACTIVE' | 'SUSPENDED' | null
    suspensionReason: text("suspension_reason"),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("cafes_slug_idx").on(table.slug),
    index("cafes_status_idx").on(table.status),
    index("cafes_created_at_idx").on(table.createdAt),
  ]
);

export type Cafe = typeof cafes.$inferSelect;
export type NewCafe = typeof cafes.$inferInsert;
