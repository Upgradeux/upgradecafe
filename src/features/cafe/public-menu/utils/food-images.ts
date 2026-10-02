/**
 * Curated high-resolution culinary photography for cafes & bistros.
 * Provides instant luxury visual appeal with optimized WebP/Unsplash images.
 */

const CURATED_IMAGES: Record<string, string> = {
  // Coffee & Espresso Classics
  cortado: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80",
  "flat-white": "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80",
  cappuccino: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80",
  latte: "https://images.unsplash.com/photo-1561882468-9110e03e0f78?auto=format&fit=crop&w=800&q=80",
  espresso: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=800&q=80",
  americano: "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=800&q=80",
  macchiato: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=800&q=80",
  mocha: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=800&q=80",

  // Cold Brews & Iced Coffee
  "nitro-cold-brew": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "espresso-tonic": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80",
  "iced-latte": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80",
  "cold-brew": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "ethiopia-yirgacheffe": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
  pour_over: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",

  // Bakery, Croissants & Pastries
  "almond-croissant": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
  croissant: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
  "pain-au-chocolat": "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=800&q=80",
  sourdough: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  bagel: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=800&q=80",

  // Brunch & Food
  "avocado-toast": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
  "smoked-chicken-pesto-panini": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  panini: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  pasta: "https://images.unsplash.com/photo-1621996346565-e3d5d6281724?auto=format&fit=crop&w=800&q=80",
  truffle_pasta: "https://images.unsplash.com/photo-1621996346565-e3d5d6281724?auto=format&fit=crop&w=800&q=80",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
  salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",

  // Desserts & Sweets
  tiramisu: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
  cheesecake: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
  brownie: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
  affogato: "https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?auto=format&fit=crop&w=800&q=80",
  waffle: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80",

  // Teas & Matchas
  matcha: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80",
  "matcha-latte": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80",
  tea: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  chai: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
};

const CATEGORY_FALLBACKS: Record<string, string> = {
  coffee: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=800&q=80",
  espresso: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
  "cold-brew": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  beverages: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
  bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  food: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  dessert: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
};

export function getMenuItemImageUrl(
  imageKey?: string | null,
  slug?: string,
  name?: string,
  categorySlug?: string
): string {
  // If uploaded custom photo exists and starts with http, use it
  if (imageKey && (imageKey.startsWith("http://") || imageKey.startsWith("https://"))) {
    return imageKey;
  }

  // Exact match by slug
  if (slug && CURATED_IMAGES[slug]) {
    return CURATED_IMAGES[slug];
  }

  // Partial match by slug or name
  const term = `${slug || ""} ${name || ""}`.toLowerCase();
  for (const [key, url] of Object.entries(CURATED_IMAGES)) {
    if (term.includes(key.replace(/-/g, " ")) || term.includes(key)) {
      return url;
    }
  }

  // Category fallback
  if (categorySlug) {
    const cat = categorySlug.toLowerCase();
    for (const [k, url] of Object.entries(CATEGORY_FALLBACKS)) {
      if (cat.includes(k)) return url;
    }
  }

  // Universal artisanal cafe fallback
  return "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80";
}

export interface CategoryVisualConfig {
  imageUrl: string;
  bgGradient: string;
}

export function getCategoryVisualConfig(categorySlug?: string, categoryName?: string): CategoryVisualConfig {
  const term = `${categorySlug || ""} ${categoryName || ""}`.toLowerCase();

  if (term.includes("burger")) {
    return {
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80",
      bgGradient: "bg-gradient-to-b from-[#FFFDF0] via-[#FEF3C7] to-[#FDE68A]/70",
    };
  }
  if (term.includes("sea") || term.includes("fish") || term.includes("shrimp") || term.includes("salmon")) {
    return {
      imageUrl: "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=300&q=80",
      bgGradient: "bg-gradient-to-b from-[#FFF7ED] via-[#FFEDD5] to-[#FDBA74]/60",
    };
  }
  if (term.includes("steak") || term.includes("beef") || term.includes("grill") || term.includes("meat")) {
    return {
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80",
      bgGradient: "bg-gradient-to-b from-[#F0FDF4] via-[#DCFCE7] to-[#86EFAC]/50",
    };
  }
  if (term.includes("pizza")) {
    return {
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80",
      bgGradient: "bg-gradient-to-b from-[#FFFBEB] via-[#FEF08A]/50 to-[#FDE047]/30",
    };
  }
  if (
    term.includes("dessert") ||
    term.includes("sweet") ||
    term.includes("cake") ||
    term.includes("tiramisu") ||
    term.includes("ice cream")
  ) {
    return {
      imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=300&q=80",
      bgGradient: "bg-gradient-to-b from-[#FFF1F2] via-[#FCE7F3] to-[#FBCFE8]/80",
    };
  }
  if (term.includes("espresso") || term.includes("coffee") || term.includes("hot")) {
    return {
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80",
      bgGradient: "bg-gradient-to-b from-[#FFFDF2] via-[#FEF3C7] to-[#F59E0B]/30",
    };
  }
  if (term.includes("cold") || term.includes("brew") || term.includes("ice") || term.includes("nitro")) {
    return {
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=300&q=80",
      bgGradient: "bg-gradient-to-b from-[#F0F9FF] via-[#E0F2FE] to-[#BAE6FD]/60",
    };
  }
  if (term.includes("bakery") || term.includes("croissant") || term.includes("pastr") || term.includes("bread")) {
    return {
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80",
      bgGradient: "bg-gradient-to-b from-[#FFF7ED] via-[#FFEDD5] to-[#FCD34D]/50",
    };
  }
  if (term.includes("food") || term.includes("panini") || term.includes("sandwich") || term.includes("brunch")) {
    return {
      imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=300&q=80",
      bgGradient: "bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A]/60",
    };
  }
  if (term.includes("tea") || term.includes("matcha") || term.includes("chai")) {
    return {
      imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=300&q=80",
      bgGradient: "bg-gradient-to-b from-[#F0FDF4] via-[#DCFCE7] to-[#A7F3D0]/60",
    };
  }
  if (term.includes("pasta") || term.includes("italian")) {
    return {
      imageUrl: "https://images.unsplash.com/photo-1621996346565-e3d5d6281724?auto=format&fit=crop&w=300&q=80",
      bgGradient: "bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A]/50",
    };
  }

  return {
    imageUrl: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=300&q=80",
    bgGradient: "bg-gradient-to-b from-[#F8FAF7] via-[#EBF2E8] to-[#D5E5D0]",
  };
}

export function getCategoryImageUrl(categorySlug?: string, categoryName?: string): string {
  return getCategoryVisualConfig(categorySlug, categoryName).imageUrl;
}
