import { pgTable, text, timestamp, uuid, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { cafes } from "./cafes";

export type HomeSectionType =
  | "CATEGORIES"
  | "FEATURED"
  | "POPULAR"
  | "TODAYS_PICKS"
  | "OFFERS"
  | "REWARDS"
  | "RECENTLY_ORDERED";

export type FeaturedTemplate =
  | "EDITORIAL_IMAGE_RIGHT"
  | "CENTER_BEND"
  | "IMAGE_BACKGROUND"
  | "MINIMAL"
  | "IMAGE_LEFT";

export type OfferTemplate =
  | "SPECIAL_CAROUSEL"
  | "SIMPLE_BANNER"
  | "ROUNDED_CARD"
  | "CENTER_BEND"
  | "OFFER_CARD"
  | "OFFER_BANNER"
  | "IMAGE_OFFER"
  | "COMPACT_OFFER";

export interface FeaturedSlideConfig {
  id: string;
  sourceType: "MENU_ITEM" | "CUSTOM";
  itemId?: string;
  badgeText?: string;
  customTitle?: string;
  customSubtitle?: string;
  price?: number;
  actionText?: string;
  imageSource?: "ITEM_IMAGE" | "CUSTOM_UPLOAD";
  customImageUrl?: string;
}

export interface OfferSlideConfig {
  id: string;
  sourceType: "SAVED_OFFER" | "CUSTOM";
  offerId?: string;
  badgeText?: string;
  customTitle?: string;
  customSubtitle?: string;
  code?: string;
  actionText?: string;
  customImageUrl?: string;
  discountValue?: string;
  voucherColor?: string;
}

export interface HomeSectionConfig {
  id: string;
  type: HomeSectionType;
  title?: string;
  subtitle?: string;
  enabled: boolean;
  sortOrder: number;
  template?: string; // FeaturedTemplate | OfferTemplate | string
  config?: {
    // For FEATURED
    featuredItemId?: string;
    featuredSlides?: FeaturedSlideConfig[];
    autoScroll?: boolean;
    autoScrollInterval?: number;
    badgeText?: string;
    customTitle?: string;
    customSubtitle?: string;
    actionText?: string;
    imageSource?: "ITEM_IMAGE" | "CUSTOM_UPLOAD";
    customImageUrl?: string;
    bannerImageUrl?: string; // backwards compatibility

    // For OFFERS
    offerId?: string;
    offerIds?: string[]; // up to 3 offers for auto or manual carousel
    offerSlides?: OfferSlideConfig[]; // up to 3 slides in carousel with custom support
    offerBadgeText?: string;
    offerCustomTitle?: string;
    offerCustomSubtitle?: string;
    offerActionText?: string;
    offerImageUrl?: string;
  };
}

export const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = [
  { id: "categories", type: "CATEGORIES", title: "Categories", enabled: true, sortOrder: 1 },
  { id: "popular", type: "POPULAR", title: "Popular items", enabled: true, sortOrder: 2 },
  { id: "todays_picks", type: "TODAYS_PICKS", title: "Today's picks", enabled: true, sortOrder: 3 },
  { id: "recently_ordered", type: "RECENTLY_ORDERED", title: "Recently ordered", enabled: true, sortOrder: 4 },
];

export const cafeSettings = pgTable(
  "cafe_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    themePreset: text("theme_preset").default("roast").notNull(),
    digitalMenuTheme: text("digital_menu_theme").default("roast").notNull(),
    layoutPreset: text("layout_preset").default("modern_app").notNull(),
    primaryColor: text("primary_color"),
    secondaryColor: text("secondary_color"),
    fontFamily: text("font_family").default("Plus Jakarta Sans").notNull(),
    borderRadius: text("border_radius").default("8px").notNull(),
    enableQrOrdering: boolean("enable_qr_ordering").default(true).notNull(),
    enableDineIn: boolean("enable_dine_in").default(true).notNull(),
    enableTakeaway: boolean("enable_takeaway").default(true).notNull(),
    allowOrderNotes: boolean("allow_order_notes").default(true).notNull(),
    enableReviews: boolean("enable_reviews").default(true).notNull(),
    enableOffers: boolean("enable_offers").default(true).notNull(),
    googleReviewUrl: text("google_review_url"),
    homeSections: jsonb("home_sections").$type<HomeSectionConfig[]>(),
    upiId: text("upi_id"),
    upiMerchantName: text("upi_merchant_name"),
    upiQrUrl: text("upi_qr_url"),
    upiQrKey: text("upi_qr_key"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("cafe_settings_cafe_id_unique_idx").on(table.cafeId),
  ]
);

export type CafeSetting = typeof cafeSettings.$inferSelect;
export type NewCafeSetting = typeof cafeSettings.$inferInsert;

