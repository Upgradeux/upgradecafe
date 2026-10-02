import { pgTable, text, timestamp, uuid, integer, index } from "drizzle-orm/pg-core";
import { cafes } from "./cafes";
import { tables } from "./tables";

export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    guests: integer("guests").notNull().default(2),
    preferenceType: text("preference_type").notNull().default("ANY"), // "ANY" | "SPECIFIC"
    preferredTableId: uuid("preferred_table_id").references(() => tables.id, { onDelete: "set null" }),
    preferredTableName: text("preferred_table_name"),
    status: text("status").notNull().default("WAITING"), // "WAITING" | "CALLED" | "SEATED" | "CANCELLED" | "EXPIRED"
    heldTableId: uuid("held_table_id").references(() => tables.id, { onDelete: "set null" }),
    holdExpiresAt: timestamp("hold_expires_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (w) => [
    index("waitlist_cafe_id_idx").on(w.cafeId),
    index("waitlist_status_idx").on(w.status),
    index("waitlist_created_at_idx").on(w.createdAt),
    index("waitlist_preferred_table_idx").on(w.preferredTableId),
  ]
);

export type WaitlistEntry = typeof waitlist.$inferSelect;
export type NewWaitlistEntry = typeof waitlist.$inferInsert;
