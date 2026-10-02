export interface TypographyPreset {
  id: string;
  name: string;
  headingFont: string;
  bodyFont: string;
  headingFontVar: string;
  bodyFontVar: string;
  tagline: string;
  description: string;
  personality: string;
  bestFor: string;
  sampleHeadline: string;
  sampleBody: string;
  badge: string;
  category:
    | "Geometric"
    | "Understated"
    | "Structured"
    | "Minimal"
    | "Artistic"
    | "Playful"
    | "Energetic"
    | "Refined"
    | "Editorial"
    | "Luxury";
  // Backwards-compatibility aliases
  fontName: string;
  fontFamilyVar: string;
}

// Backwards compatibility type alias
export type FontPreset = TypographyPreset;

export const CAFE_FONT_PRESETS: Record<string, TypographyPreset> = {
  modern: {
    id: "modern",
    name: "Modern",
    headingFont: "Outfit",
    bodyFont: "Inter",
    headingFontVar: "var(--font-outfit), sans-serif",
    bodyFontVar: "var(--font-inter), sans-serif",
    tagline: "Contemporary · Geometric",
    description: "Geometric construction with fresh, contemporary curves that works particularly well at large display sizes while staying clean for digital ordering.",
    personality: "Fresh · contemporary · minimal · digital",
    bestFor: "Specialty coffee roasters, urban brunch spots, modern bakeries.",
    sampleHeadline: "The Roastery • Cold Brew & Flat White",
    sampleBody: "Single-origin Ethiopian beans with jasmine, bergamot, and honey notes.",
    badge: "Most Popular",
    category: "Geometric",
    fontName: "Outfit",
    fontFamilyVar: "var(--font-outfit), sans-serif",
  },
  subtle: {
    id: "subtle",
    name: "Subtle",
    headingFont: "Manrope",
    bodyFont: "Inter",
    headingFontVar: "var(--font-manrope), sans-serif",
    bodyFontVar: "var(--font-inter), sans-serif",
    tagline: "Soft · Understated",
    description: "Geometric foundations with softer, humanist details. Quietly makes the interface feel more designed without screaming for attention.",
    personality: "Calm · refined · understated · modern",
    bestFor: "Specialty coffee, minimalist cafés, Scandinavian-style cafés, calm interiors.",
    sampleHeadline: "Nordic Roast • House Espresso & Filter",
    sampleBody: "Light roast washed lot with balanced citrus acidity and clean sweetness.",
    badge: "Soft & Calm",
    category: "Understated",
    fontName: "Manrope",
    fontFamilyVar: "var(--font-manrope), sans-serif",
  },
  professional: {
    id: "professional",
    name: "Professional",
    headingFont: "Plus Jakarta Sans",
    bodyFont: "DM Sans",
    headingFontVar: "var(--font-jakarta-sans), sans-serif",
    bodyFontVar: "var(--font-dm-sans), sans-serif",
    tagline: "Polished · Structured",
    description: "Clean geometry with softer curves. Polished and structured without feeling corporate—the typography expected from well-established café brands.",
    personality: "Polished · reliable · contemporary · organized",
    bestFor: "Established café chains, busy flagship venues, premium espresso bars.",
    sampleHeadline: "Signature Reserve • Flagship Roastery",
    sampleBody: "Crafted double espresso extractions, seasonal blends, and freshly baked viennoiserie.",
    badge: "Structured",
    category: "Structured",
    fontName: "Plus Jakarta Sans",
    fontFamilyVar: "var(--font-jakarta-sans), sans-serif",
  },
  clean: {
    id: "clean",
    name: "Clean",
    headingFont: "DM Sans",
    bodyFont: "Inter",
    headingFontVar: "var(--font-dm-sans), sans-serif",
    bodyFontVar: "var(--font-inter), sans-serif",
    tagline: "Minimal · Clear",
    description: "Neutral, extremely readable, and uncluttered. Low-contrast structure that lets high-end food photography take center stage.",
    personality: "Minimal · crisp · functional · uncluttered",
    bestFor: "Cafés with strong food photography wanting typography to stay in the background.",
    sampleHeadline: "Pure Brew • Daily Tasting Board",
    sampleBody: "Crisp extraction balance, seasonal fruit bowls, and house sourdough toasts.",
    badge: "Photo First",
    category: "Minimal",
    fontName: "DM Sans",
    fontFamilyVar: "var(--font-dm-sans), sans-serif",
  },
  creative: {
    id: "creative",
    name: "Creative",
    headingFont: "Syne",
    bodyFont: "Manrope",
    headingFontVar: "var(--font-syne), sans-serif",
    bodyFontVar: "var(--font-manrope), sans-serif",
    tagline: "Artistic · Expressive",
    description: "Unusual proportions and distinctive letterforms that break free from generic startup typography for genuine artistic distinction.",
    personality: "Artistic · experimental · expressive · unconventional",
    bestFor: "Art cafés, design cafés, creative studios, concept cafés, experimental brands.",
    sampleHeadline: "Studio Atelier • Micro-Lot Ferment",
    sampleBody: "Anaerobic natural process beans with wild blueberry and cacao nib undertones.",
    badge: "Artistic",
    category: "Artistic",
    fontName: "Syne",
    fontFamilyVar: "var(--font-syne), sans-serif",
  },
  playful: {
    id: "playful",
    name: "Playful",
    headingFont: "Fredoka",
    bodyFont: "Nunito Sans",
    headingFontVar: "var(--font-fredoka), cursive, sans-serif",
    bodyFontVar: "var(--font-nunito-sans), sans-serif",
    tagline: "Friendly · Cheerful",
    description: "Rounded, friendly inflated forms that immediately create a cheerful and welcoming atmosphere while Nunito Sans keeps the menu clear.",
    personality: "Cute · warm · friendly · approachable",
    bestFor: "Dessert cafés, brunch spots, boba shops, family cafés, colorful brands.",
    sampleHeadline: "Sweet Delights • Berry Glazed Croissants",
    sampleBody: "Fluffy Japanese souffle pancakes, matcha lattes, and artisan donuts.",
    badge: "Warm & Cozy",
    category: "Playful",
    fontName: "Fredoka",
    fontFamilyVar: "var(--font-fredoka), cursive, sans-serif",
  },
  fun: {
    id: "fun",
    name: "Fun",
    headingFont: "Bungee",
    bodyFont: "DM Sans",
    headingFontVar: "var(--font-bungee), cursive, sans-serif",
    bodyFontVar: "var(--font-dm-sans), sans-serif",
    tagline: "Bold · Energetic",
    description: "Strong signage and physical café display character. Bold, punchy letterforms that bring retro street-café energy to large display headings.",
    personality: "Energetic · bold · youthful · expressive",
    bestFor: "Street cafés, retro diners, funky cafés, student hubs, colorful brands.",
    sampleHeadline: "STREET ROAST • CRUNCH & BREW",
    sampleBody: "Loaded brioche smash burgers, dirty spiced chai, and nitro taps.",
    badge: "Signage Vibe",
    category: "Energetic",
    fontName: "Bungee",
    fontFamilyVar: "var(--font-bungee), cursive, sans-serif",
  },
  aesthetic: {
    id: "aesthetic",
    name: "Aesthetic",
    headingFont: "Sora",
    bodyFont: "Manrope",
    headingFontVar: "var(--font-sora), sans-serif",
    bodyFontVar: "var(--font-manrope), sans-serif",
    tagline: "Stylish · Refined",
    description: "Geometric construction with distinctive proportions and subtly rounded details. Fashionable, refined, and visual-first.",
    personality: "Instagrammable · stylish · refined · contemporary",
    bestFor: "Minimalist interiors, ceramic cups, natural light, carefully photographed coffee.",
    sampleHeadline: "Atelier Social • Ceramic & Pour",
    sampleBody: "Hand-whisked Uji matcha, cloud foam iced lattes, and whipped ricotta brioche.",
    badge: "Visual First",
    category: "Refined",
    fontName: "Sora",
    fontFamilyVar: "var(--font-sora), sans-serif",
  },
  premium: {
    id: "premium",
    name: "Premium",
    headingFont: "Playfair Display",
    bodyFont: "Plus Jakarta Sans",
    headingFontVar: "var(--font-playfair), Georgia, serif",
    bodyFontVar: "var(--font-jakarta-sans), sans-serif",
    tagline: "Editorial · Sophisticated",
    description: "High thick/thin contrast display serif creating an editorial appearance, paired with Plus Jakarta Sans for clean modern UI clarity.",
    personality: "Sophisticated · editorial · polished · upscale",
    bestFor: "Weekend brunch bistros, specialty coffee bars, boutique wine and coffee spaces.",
    sampleHeadline: "Specialty Coffee • Weekend Brunch",
    sampleBody: "Single-origin Geisha pour-over and house-smoked Tasmanian salmon brioche.",
    badge: "Editorial Serif",
    category: "Editorial",
    fontName: "Playfair Display",
    fontFamilyVar: "var(--font-playfair), Georgia, serif",
  },
  luxury: {
    id: "luxury",
    name: "Luxury",
    headingFont: "Cormorant Garamond",
    bodyFont: "Manrope",
    headingFontVar: "var(--font-cormorant), Georgia, serif",
    bodyFontVar: "var(--font-manrope), sans-serif",
    tagline: "Elegant · Timeless",
    description: "Delicate, high-contrast serif forms with refined calligraphic elegance, contrasted with modern Manrope UI for luxury boutique branding.",
    personality: "Elegant · refined · exclusive · sophisticated",
    bestFor: "Boutique cafés, fine patisseries, hotel cafés, upscale coffee lounges.",
    sampleHeadline: "Grand Reserve • Haute Patisserie",
    sampleBody: "Rare micro-lot reserve coffees, pistachio mille-feuille, and afternoon tea service.",
    badge: "Haute Couture",
    category: "Luxury",
    fontName: "Cormorant Garamond",
    fontFamilyVar: "var(--font-cormorant), Georgia, serif",
  },
};

/**
 * Resolves full typography preset for any saved preset ID or font name
 */
export function getTypographyPreset(fontIdOrName?: string | null): TypographyPreset {
  if (!fontIdOrName) return CAFE_FONT_PRESETS.modern;

  const normalized = fontIdOrName.toLowerCase().trim();

  // Direct ID check
  if (CAFE_FONT_PRESETS[normalized]) {
    return CAFE_FONT_PRESETS[normalized];
  }

  // Backwards compatibility alias
  if (normalized === "cursive") {
    return CAFE_FONT_PRESETS.premium;
  }

  // Name or keyword heuristics
  if (normalized.includes("outfit") || normalized.includes("modern")) {
    return CAFE_FONT_PRESETS.modern;
  }
  if (normalized.includes("manrope") || normalized.includes("subtle")) {
    return CAFE_FONT_PRESETS.subtle;
  }
  if (normalized.includes("jakarta") || normalized.includes("professional")) {
    return CAFE_FONT_PRESETS.professional;
  }
  if (normalized === "clean") {
    return CAFE_FONT_PRESETS.clean;
  }
  if (normalized.includes("syne") || normalized.includes("creative")) {
    return CAFE_FONT_PRESETS.creative;
  }
  if (
    normalized.includes("fredoka") ||
    normalized.includes("playful") ||
    normalized.includes("comfortaa") ||
    normalized.includes("quicksand")
  ) {
    return CAFE_FONT_PRESETS.playful;
  }
  if (normalized.includes("bungee") || normalized.includes("fun")) {
    return CAFE_FONT_PRESETS.fun;
  }
  if (normalized.includes("sora") || normalized.includes("aesthetic")) {
    return CAFE_FONT_PRESETS.aesthetic;
  }
  if (
    normalized.includes("playfair") ||
    normalized.includes("premium") ||
    normalized.includes("editorial")
  ) {
    return CAFE_FONT_PRESETS.premium;
  }
  if (
    normalized.includes("cormorant") ||
    normalized.includes("garamond") ||
    normalized.includes("luxury")
  ) {
    return CAFE_FONT_PRESETS.luxury;
  }
  if (normalized.includes("dm sans")) {
    return CAFE_FONT_PRESETS.clean;
  }

  return CAFE_FONT_PRESETS.modern;
}

/**
 * Resolves font family CSS string for any saved preset ID or font name
 */
export function getFontFamilyVar(fontIdOrName?: string | null): string {
  return getTypographyPreset(fontIdOrName).bodyFontVar;
}

/**
 * Resolves display/heading font family CSS string for any saved preset ID or font name
 */
export function getHeadingFontVar(fontIdOrName?: string | null): string {
  return getTypographyPreset(fontIdOrName).headingFontVar;
}
