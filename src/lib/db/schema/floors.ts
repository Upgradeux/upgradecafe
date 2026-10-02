import { pgTable, text, timestamp, uuid, integer, index } from "drizzle-orm/pg-core";
import { cafes } from "./cafes";

export const floors = pgTable(
  "floors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("floors_cafe_id_idx").on(table.cafeId),
  ]
);

export type Floor = typeof floors.$inferSelect;
export type NewFloor = typeof floors.$inferInsert;
