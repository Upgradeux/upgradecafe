export type QrThemePresetId =
  | "roast"
  | "bakery"
  | "garden"
  | "noir"
  | "play"
  | "onyx"
  | "sage"
  | "champagne";

export interface QrThemePreset {
  id: QrThemePresetId;
  name: string;
  tagline: string;
  qrColor: string; // Hex without # for QR API
  primaryColor: string;
  accentColor: string;
  cardBg: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}

export const QR_THEME_PRESETS: Record<QrThemePresetId, QrThemePreset> = {
  roast: {
    id: "roast",
    name: "Artisanal Roast",
    tagline: "Warm espresso, brass & craft paper",
    qrColor: "2C1810",
    primaryColor: "#8B5E3C",
    accentColor: "#D89B72",
    cardBg: "#FAF8F4",
    textColor: "#292724",
    mutedColor: "#77716A",
    borderColor: "#E9E4DC",
  },
  bakery: {
    id: "bakery",
    name: "Warm Bakery",
    tagline: "Soft rose, almond & warm ivory pastry aesthetic",
    qrColor: "5A261D",
    primaryColor: "#C46D5E",
    accentColor: "#E39B8F",
    cardBg: "#FCFAF7",
    textColor: "#2B2523",
    mutedColor: "#7A6E69",
    borderColor: "#EFE6DE",
  },
  garden: {
    id: "garden",
    name: "Botanical Garden",
    tagline: "Forest evergreen, organic linen & matcha green",
    qrColor: "1B3B2B",
    primaryColor: "#3F6E50",
    accentColor: "#6B9B7B",
    cardBg: "#F8FAF8",
    textColor: "#222823",
    mutedColor: "#68736A",
    borderColor: "#DFE5DF",
  },
  noir: {
    id: "noir",
    name: "Editorial Noir",
    tagline: "Architectural charcoal & pure minimalist nuance",
    qrColor: "1C1917",
    primaryColor: "#292524",
    accentColor: "#57534E",
    cardBg: "#F5F5F4",
    textColor: "#1C1917",
    mutedColor: "#78716C",
    borderColor: "#E7E5E4",
  },
  play: {
    id: "play",
    name: "Playful Coral",
    tagline: "Energetic vibrant coral & roasted brown accents",
    qrColor: "4A1A0F",
    primaryColor: "#D95D39",
    accentColor: "#E58364",
    cardBg: "#FAF7F2",
    textColor: "#26221F",
    mutedColor: "#756D66",
    borderColor: "#EBE3DA",
  },
  onyx: {
    id: "onyx",
    name: "Minimal Onyx",
    tagline: "Architectural charcoal & pure minimalist white",
    qrColor: "1C1917",
    primaryColor: "#1C1917",
    accentColor: "#57534E",
    cardBg: "#FFFFFF",
    textColor: "#1C1917",
    mutedColor: "#78716C",
    borderColor: "#E7E5E4",
  },
  champagne: {
    id: "champagne",
    name: "Warm Champagne",
    tagline: "Boutique gold, warm sand & ivory",
    qrColor: "2E2218",
    primaryColor: "#B38742",
    accentColor: "#D4AF37",
    cardBg: "#FAF7F2",
    textColor: "#2A231C",
    mutedColor: "#8C7E72",
    borderColor: "#EBDCC8",
  },
  sage: {
    id: "sage",
    name: "Botanical Sage",
    tagline: "Forest evergreen, organic linen & sage",
    qrColor: "1B3B2B",
    primaryColor: "#2F5D44",
    accentColor: "#5E8C70",
    cardBg: "#F7FAF8",
    textColor: "#1E2A22",
    mutedColor: "#6B7B70",
    borderColor: "#DAE5DE",
  },
};

export type QrStandFormat = "acrylic" | "tent" | "coaster";

export type CenterLogoType = "brand" | "initials" | "none";

export interface QrCustomizerConfig {
  preset: QrThemePresetId;
  standFormat: QrStandFormat;
  subtitle: string;
  scanPrompt: string;
  showSeats: boolean;
  showWifi: boolean;
  wifiText: string;
  centerLogo: CenterLogoType;
  customInitials: string;
  cafeLogoKey?: string | null;
}

export const DEFAULT_QR_CONFIG: QrCustomizerConfig = {
  preset: "roast",
  standFormat: "acrylic",
  subtitle: "Scan to browse digital menu & place order",
  scanPrompt: "Point camera to order",
  showSeats: true,
  showWifi: true,
  wifiText: "Complimentary Guest Wi-Fi",
  centerLogo: "brand",
  customInitials: "RB",
  cafeLogoKey: null,
};
