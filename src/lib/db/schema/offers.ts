import { pgTable, text, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";
import { cafes } from "./cafes";

export type DiscountType = "PERCENTAGE" | "FLAT" | "FREE_ITEM";
export type OfferApplicationMethod = "AUTOMATIC" | "COUPON_CODE";
export type OfferAppliesTo = "ALL" | "CATEGORIES" | "ITEMS";
export type CustomerEligibility = "ALL" | "NEW" | "RETURNING" | "LOYALTY";
export type FreeItemUnlockType = "SPEND" | "CATEGORY" | "ITEM";
export type OfferOrderType = "BOTH" | "DINE_IN" | "TAKEAWAY";

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  cafeId: uuid("cafe_id")
    .notNull()
    .references(() => cafes.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  discountType: text("discount_type").$type<DiscountType>().default("PERCENTAGE").notNull(),
  discountValue: integer("discount_value").notNull(),
  maxDiscountAmount: integer("max_discount_amount"),
  minOrderAmount: integer("min_order_amount").default(0),
  rewardItemId: uuid("reward_item_id"),
  rewardItemName: text("reward_item_name"),
  applicationMethod: text("application_method").$type<OfferApplicationMethod>().default("COUPON_CODE").notNull(),
  appliesTo: text("applies_to").$type<OfferAppliesTo>().default("ALL").notNull(),
  targetCategoryIds: text("target_category_ids"), // Comma-separated or JSON
  targetItemIds: text("target_item_ids"), // Comma-separated or JSON
  customerEligibility: text("customer_eligibility").$type<CustomerEligibility>().default("ALL").notNull(),
  usageLimitTotal: integer("usage_limit_total"),
  usageLimitPerCustomer: integer("usage_limit_per_customer").default(1),
  timeStart: text("time_start"), // "14:00"
  timeEnd: text("time_end"), // "17:00"
  daysOfWeek: text("days_of_week"), // "1,2,3,4,5"
  availableChannels: text("available_channels").default("DIGITAL_MENU,POS").notNull(),
  applicableOrderType: text("applicable_order_type").$type<OfferOrderType>().default("BOTH").notNull(),
  cannotCombine: boolean("cannot_combine").default(true).notNull(),
  freeItemUnlockType: text("free_item_unlock_type").$type<FreeItemUnlockType>().default("SPEND").notNull(),
  freeItemQualifyingCategoryId: uuid("free_item_qualifying_category_id"),
  freeItemQualifyingItemId: uuid("free_item_qualifying_item_id"),
  badgeText: text("badge_text").default("Limited Time"),
  imageUrl: text("image_url"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;

