import { pgTable, text, timestamp, uuid, integer, boolean, index } from "drizzle-orm/pg-core";
import { cafes } from "./cafes";
import { categories } from "./categories";

export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    isVegetarian: boolean("is_vegetarian").default(true).notNull(),
    foodType: text("food_type").default("VEG").notNull(), // 'VEG', 'NON_VEG', 'EGG', 'VEGAN'
    isBestseller: boolean("is_bestseller").default(false).notNull(),
    isSpicy: boolean("is_spicy").default(false).notNull(),
    temperature: text("temperature").default("NOT_APPLICABLE").notNull(), // 'HOT', 'COLD', 'ROOM_TEMP', 'NOT_APPLICABLE'
    allergens: text("allergens"),
    calories: integer("calories"),
    proteinGrams: integer("protein_grams"),
    fatGrams: integer("fat_grams"),
    carbsGrams: integer("carbs_grams"),
    imageKey: text("image_key"),
    preparationTimeMinutes: integer("preparation_time_minutes").default(10),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("menu_items_cafe_id_idx").on(table.cafeId),
    index("menu_items_category_id_idx").on(table.categoryId),
    index("menu_items_is_available_idx").on(table.isAvailable),
    index("menu_items_sort_order_idx").on(table.sortOrder),
  ]
);

export const menuItemVariants = pgTable(
  "menu_item_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    price: integer("price").notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("menu_item_variants_item_id_idx").on(table.menuItemId),
  ]
);

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type MenuItemVariant = typeof menuItemVariants.$inferSelect;
export type NewMenuItemVariant = typeof menuItemVariants.$inferInsert;
