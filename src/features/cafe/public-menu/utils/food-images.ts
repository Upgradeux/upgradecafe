import { parseMenuItemImages } from "@/features/cafe/menu/utils/image-helpers";

const MENU_IMAGE_PLACEHOLDER = "/images/menu-item-placeholder.svg";

/** Uses café-uploaded images only; never substitutes an unrelated stock photo. */
export function getMenuItemImageUrl(
  imageKey?: string | null,
  _slug?: string,
  _name?: string,
  _categorySlug?: string
): string {
  return parseMenuItemImages(imageKey)[0] || MENU_IMAGE_PLACEHOLDER;
}

export interface CategoryVisualConfig {
  imageUrl: string;
  bgGradient: string;
}

export function getCategoryVisualConfig(
  _categorySlug?: string,
  _categoryName?: string,
  categoryImageUrl?: string | null
): CategoryVisualConfig {
  return {
    imageUrl:
      categoryImageUrl && categoryImageUrl.trim().length > 0
        ? categoryImageUrl
        : MENU_IMAGE_PLACEHOLDER,
    bgGradient: "bg-gradient-to-b from-stone-50 to-stone-100",
  };
}

export function getCategoryImageUrl(
  categorySlug?: string,
  categoryName?: string,
  categoryImageUrl?: string | null
): string {
  return getCategoryVisualConfig(categorySlug, categoryName, categoryImageUrl).imageUrl;
}
