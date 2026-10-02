import { pgTable, text, timestamp, uuid, integer, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { cafes } from "./cafes";
import { floors } from "./floors";

export const tables = pgTable(
  "tables",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    floorId: uuid("floor_id")
      .references(() => floors.id, { onDelete: "set null" }),
    tableNumber: text("table_number").notNull(),
    capacity: integer("capacity").default(2).notNull(),
    status: text("status").default("AVAILABLE").notNull(), // 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
    currentGuests: integer("current_guests"),
    occupiedSinceMinutes: integer("occupied_since_minutes"),
    currentBillAmount: integer("current_bill_amount"),
    reservedForTime: text("reserved_for_time"), // e.g. "7:30 PM"
    notes: text("notes"),
    qrIdentifier: text("qr_identifier").notNull(), // unique token e.g. "tbl-c0ffee-01"
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("tables_cafe_id_idx").on(table.cafeId),
    index("tables_floor_id_idx").on(table.floorId),
    uniqueIndex("tables_qr_identifier_idx").on(table.qrIdentifier),
    index("tables_status_idx").on(table.status),
  ]
);

export type Table = typeof tables.$inferSelect;
export type NewTable = typeof tables.$inferInsert;
