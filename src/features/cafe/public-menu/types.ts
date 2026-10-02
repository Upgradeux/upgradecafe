import { MenuItem, MenuItemVariant } from "@/lib/db/schema/menu-items";
import { FullModifierGroupWithOption } from "@/lib/db/schema/modifiers";
import { OrderWithItems } from "@/features/cafe/orders/types";

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  loyaltyPoints: number;
  isGuest: boolean;
  memberTier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  // Collectibles: Stamps, Badges & Stickers
  stampsCollected?: number;
  stampsRequired?: number;
  earnedBadges?: string[];
  selectedBadges?: string[];
  unlockedStickers?: string[];
  stickerPlacements?: Record<string, string>; // e.g. { top_left: "latte_art", around_avatar: "crown", ... }
}

export interface CustomizationOption {
  id: string;
  label: string;
  priceDelta: number;
}

export interface ItemCustomizationConfig {
  sizes?: CustomizationOption[];
  milkChoices?: CustomizationOption[];
  sweetnessLevels?: string[];
  temperatureChoices?: string[];
  addOns?: CustomizationOption[];
}

export interface CartCustomizationState {
  size?: CustomizationOption;
  milkChoice?: CustomizationOption;
  sweetness?: string;
  temperature?: string;
  addOns?: CustomizationOption[];
  specialInstructions?: string;
}

export interface DigitalMenuCartItem {
  cartItemId: string; // unique for item + exact customization combo
  menuItem: MenuItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customization: CartCustomizationState;
  variantSnapshotText: string; // e.g. "Large • Oat Milk (+₹35) • Less Sugar"
  availableModifierGroups?: FullModifierGroupWithOption[];
  availableVariants?: MenuItemVariant[];
}

export interface TableReservationRequest {
  cafeId: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  date: string;
  timeSlot: string;
  notes?: string;
}

export interface CustomerFeedbackRequest {
  cafeId: string;
  orderNumber?: string;
  rating: number; // 1 to 5
  tags: string[];
  comment?: string;
}
