import { Cafe } from "@/lib/db/schema/cafes";
import { Category } from "@/lib/db/schema/categories";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { Table } from "@/lib/db/schema/tables";
import { DigitalMenuCartItem, CustomerProfile } from "../types";
import { HomeSectionConfig } from "@/lib/db/schema/cafe-settings";
import { Offer } from "@/lib/db/schema/offers";
import { OrderWithItems } from "@/features/cafe/orders/types";

export type MenuLayoutType = "modern_app" | "classic_list";

export interface CustomerPastOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  imageKey?: string | null;
  slug?: string;
}

export interface CustomerPastOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  itemsCount: number;
  items?: CustomerPastOrderItem[];
}

export interface MenuLayoutProps {
  cafe: Cafe;
  categories: Category[];
  menuItems: MenuItem[];
  filteredItems: MenuItem[];
  bestsellers: MenuItem[];
  popularItems?: MenuItem[];
  salesStats30d?: Record<string, number>;
  activeTableName: string | null;
  table: Table | null;
  customerProfile: CustomerProfile | null;
  activeOrders?: OrderWithItems[];
  activeOrderId: string | null;
  activeOrderNumber: string | null;
  homeSections?: HomeSectionConfig[];
  offers?: Offer[];
  pastOrders?: CustomerPastOrder[];
  digitalMenuTheme?: string;
  isAllMenuPage?: boolean;
  initialBottomTab?: "home" | "menu" | "offers" | "orders" | "cart" | "profile" | "get_app" | "wallet";
  isOffersOpen?: boolean;
  deferredPrompt?: any;

  // Search & Filter state
  search: string;
  setSearch: (val: string) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (catId: string) => void;
  dietFilter: "ALL" | "VEG" | "NON_VEG" | "VEGAN" | "BESTSELLER" | "FAVORITES";
  setDietFilter: (filter: "ALL" | "VEG" | "NON_VEG" | "VEGAN" | "BESTSELLER" | "FAVORITES") => void;

  // Favorites state
  favorites: string[];
  toggleFavorite: (itemId: string) => void;

  // Cart state
  cart: DigitalMenuCartItem[];
  cartCount: number;
  cartTotal: number;

  // Action handlers
  onSelectItem: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  onQuickMinus?: (item: MenuItem) => void;
  onOpenCart: () => void;
  onOpenOrders?: () => void;
  onOpenLiveTracker: () => void;
  onOpenProfile: () => void;
  onOpenOffers?: (offerCode?: string) => void;
  onClaimOffer?: (offerCode: string) => void;
  claimedOfferCodes?: string[];
  appliedOfferCode?: string | null;
  menuItemNamesById?: Record<string, string>;
  categoryNamesById?: Record<string, string>;
  onOpenCallStaff: () => void;
  onShareMenu: () => void;
}
