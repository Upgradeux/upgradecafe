import { pgTable, text, timestamp, uuid, integer, boolean, index } from "drizzle-orm/pg-core";
import { cafes } from "./cafes";
import { menuItems } from "./menu-items";

export type ModifierSelectionType = "SINGLE" | "MULTIPLE";

export const modifierGroups = pgTable(
  "modifier_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "Milk Choice", "Extra Toppings", "Dips & Sauces"
    description: text("description"), // e.g. "Choose your favorite milk"
    selectionType: text("selection_type").$type<ModifierSelectionType>().default("MULTIPLE").notNull(),
    isRequired: boolean("is_required").default(false).notNull(),
    minSelections: integer("min_selections").default(0).notNull(),
    maxSelections: integer("max_selections"), // null for unlimited
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("modifier_groups_cafe_id_idx").on(table.cafeId),
    index("modifier_groups_sort_order_idx").on(table.sortOrder),
  ]
);

export const modifierOptions = pgTable(
  "modifier_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    modifierGroupId: uuid("modifier_group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "Oat Milk", "Extra Cheese", "Truffle Dip"
    priceDelta: integer("price_delta").default(0).notNull(), // In Rupees (e.g. 50, 30, 0)
    dietaryType: text("dietary_type").$type<"VEG" | "NON_VEG" | "EGG" | "VEGAN" | "NONE">().default("VEG"),
    isAvailable: boolean("is_available").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("modifier_options_group_id_idx").on(table.modifierGroupId),
  ]
);

export const menuItemModifierGroups = pgTable(
  "menu_item_modifier_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    modifierGroupId: uuid("modifier_group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    index("menu_item_mod_item_idx").on(table.menuItemId),
    index("menu_item_mod_group_idx").on(table.modifierGroupId),
  ]
);

export type ModifierGroup = typeof modifierGroups.$inferSelect;
export type NewModifierGroup = typeof modifierGroups.$inferInsert;
export type ModifierOption = typeof modifierOptions.$inferSelect;
export type NewModifierOption = typeof modifierOptions.$inferInsert;
export type MenuItemModifierGroup = typeof menuItemModifierGroups.$inferSelect;
export type NewMenuItemModifierGroup = typeof menuItemModifierGroups.$inferInsert;

export interface FullModifierGroupWithOption extends ModifierGroup {
  options: ModifierOption[];
}
