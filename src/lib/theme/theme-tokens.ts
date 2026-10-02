export interface ThemeColors {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary?: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  fontFamily: string;
}

/**
 * Super Admin Core Theme (Neutral graphite + warm cream + muted terracotta)
 */
export const SUPER_ADMIN_THEME: ThemeColors = {
  background: '#F7F6F2',
  surface: '#FFFFFF',
  foreground: '#242321',
  muted: '#73716B',
  border: '#E7E4DD',
  borderSubtle: '#F0EDE6',
  primary: '#B85C3A',       // Muted Terracotta
  primaryHover: '#994A2E',
  primaryLight: '#FBF4F0',
  success: '#4E7A5A',       // Active
  successLight: '#F0F6F2',
  warning: '#B8863B',       // Grace
  warningLight: '#FBF6EE',
  danger: '#B64A45',        // Suspended
  dangerLight: '#FAF1F0',
};

/**
 * Curated Café Theme Presets (For future Café platform and Public Menu)
 */
export const CAFE_THEME_PRESETS: Record<string, ThemePreset> = {
  roast: {
    id: 'roast',
    name: 'Roast',
    description: 'Warm coffee with espresso, cream & terracotta undertones',
    fontFamily: 'Plus Jakarta Sans',
    colors: {
      background: '#FAF8F4',
      surface: '#FFFFFF',
      foreground: '#292724',
      muted: '#77716A',
      border: '#E9E4DC',
      borderSubtle: '#F3EFE9',
      primary: '#8B5E3C',
      primaryHover: '#754C30',
      primaryLight: '#F8F3EE',
      secondary: '#D89B72',
      success: '#66805F',
      successLight: '#F2F5F1',
      warning: '#C4934A',
      warningLight: '#FAF5ED',
      danger: '#B65D54',
      dangerLight: '#FAF1F0',
    },
  },
  bakery: {
    id: 'bakery',
    name: 'Bakery',
    description: 'Soft and sweet pastry aesthetic with warm ivory and peach accents',
    fontFamily: 'Plus Jakarta Sans',
    colors: {
      background: '#FCFAF7',
      surface: '#FFFFFF',
      foreground: '#2B2523',
      muted: '#7A6E69',
      border: '#EFE6DE',
      borderSubtle: '#F7F0E9',
      primary: '#C46D5E',
      primaryHover: '#A85749',
      primaryLight: '#FCF3F1',
      success: '#5A8268',
      successLight: '#F1F7F3',
      warning: '#C6883E',
      warningLight: '#FAF4EB',
      danger: '#BD544D',
      dangerLight: '#FAF1F0',
    },
  },
  garden: {
    id: 'garden',
    name: 'Garden',
    description: 'Botanical freshness with sage, olive and warm white',
    fontFamily: 'Plus Jakarta Sans',
    colors: {
      background: '#F8FAF8',
      surface: '#FFFFFF',
      foreground: '#222823',
      muted: '#68736A',
      border: '#DFE5DF',
      borderSubtle: '#EEF2EE',
      primary: '#3F6E50',
      primaryHover: '#31573F',
      primaryLight: '#EFF5F1',
      success: '#4B7B59',
      successLight: '#F0F6F2',
      warning: '#B8863B',
      warningLight: '#FBF6EE',
      danger: '#B64A45',
      dangerLight: '#FAF1F0',
    },
  },
  noir: {
    id: 'noir',
    name: 'Noir',
    description: 'Premium dark editorial with copper and charcoal nuances',
    fontFamily: 'Plus Jakarta Sans',
    colors: {
      background: '#F5F5F4',
      surface: '#FFFFFF',
      foreground: '#1C1917',
      muted: '#78716C',
      border: '#E7E5E4',
      borderSubtle: '#F0EFEB',
      primary: '#292524',
      primaryHover: '#1C1917',
      primaryLight: '#F5F5F4',
      success: '#3F6E50',
      successLight: '#EFF5F1',
      warning: '#B8863B',
      warningLight: '#FBF6EE',
      danger: '#B64A45',
      dangerLight: '#FAF1F0',
    },
  },
  play: {
    id: 'play',
    name: 'Play',
    description: 'Energetic vibrant cafe vibe with coral and roasted brown accents',
    fontFamily: 'Plus Jakarta Sans',
    colors: {
      background: '#FAF7F2',
      surface: '#FFFFFF',
      foreground: '#26221F',
      muted: '#756D66',
      border: '#EBE3DA',
      borderSubtle: '#F4ECE4',
      primary: '#D95D39',
      primaryHover: '#BD4826',
      primaryLight: '#FCF3F0',
      secondary: '#E07A5F',
      success: '#4E7A5A',
      successLight: '#F0F6F2',
      warning: '#C4934A',
      warningLight: '#FAF5ED',
      danger: '#B64A45',
      dangerLight: '#FAF1F0',
    },
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Fresh, modern and clean azure with golden sunlight accents',
    fontFamily: 'Outfit',
    colors: {
      background: '#F5FAFD',
      surface: '#FFFFFF',
      foreground: '#202428',
      muted: '#6C7682',
      border: '#DCECF5',
      borderSubtle: '#EBF4F9',
      primary: '#30AFFF',
      primaryHover: '#1E97E3',
      primaryLight: '#EAF7FF',
      secondary: '#67C5F2',
      success: '#3EA370',
      successLight: '#EFF8F3',
      warning: '#FFC857',
      warningLight: '#FFF9ED',
      danger: '#E24A4A',
      dangerLight: '#FDF1F1',
    },
  },
  sun: {
    id: 'sun',
    name: 'Sun',
    description: 'Sunny, cheerful and warm bright yellow with sunset accents',
    fontFamily: 'Outfit',
    colors: {
      background: '#FFFCF2',
      surface: '#FFFFFF',
      foreground: '#292722',
      muted: '#787265',
      border: '#EFE8D3',
      borderSubtle: '#F8F3E5',
      primary: '#FFC83D',
      primaryHover: '#E5B02B',
      primaryLight: '#FFF9EB',
      secondary: '#FFD96A',
      success: '#4E8752',
      successLight: '#F0F7F1',
      warning: '#FF8A4C',
      warningLight: '#FFF3ED',
      danger: '#DC4437',
      dangerLight: '#FDF1F0',
    },
  },
  blush: {
    id: 'blush',
    name: 'Blush',
    description: 'Cute, playful and stylish bakery pink with fresh mint accents',
    fontFamily: 'Fredoka',
    colors: {
      background: '#FFF7FA',
      surface: '#FFFFFF',
      foreground: '#292329',
      muted: '#786C78',
      border: '#F5DEE7',
      borderSubtle: '#FAEDF3',
      primary: '#FF6FAE',
      primaryHover: '#E85596',
      primaryLight: '#FFF0F6',
      secondary: '#FF9BC5',
      success: '#8ED081',
      successLight: '#F3FAF1',
      warning: '#FFA338',
      warningLight: '#FFF7EE',
      danger: '#E04858',
      dangerLight: '#FDF1F2',
    },
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    description: 'Creative, aesthetic and youthful bright purple with golden accents',
    fontFamily: 'Sora',
    colors: {
      background: '#F9F7FF',
      surface: '#FFFFFF',
      foreground: '#27232D',
      muted: '#736D7B',
      border: '#E6DFF6',
      borderSubtle: '#F1ECFB',
      primary: '#9B6DFF',
      primaryHover: '#8350F2',
      primaryLight: '#F4EFFF',
      secondary: '#B89AFF',
      success: '#48A870',
      successLight: '#EEF8F2',
      warning: '#FFC857',
      warningLight: '#FFF9ED',
      danger: '#DE4343',
      dangerLight: '#FDF1F1',
    },
  },
  coral: {
    id: 'coral',
    name: 'Coral',
    description: 'Bold, energetic and expressive bright coral with sunny warmth',
    fontFamily: 'Plus Jakarta Sans',
    colors: {
      background: '#FFF7F5',
      surface: '#FFFFFF',
      foreground: '#292323',
      muted: '#7A6E6E',
      border: '#F6DDD9',
      borderSubtle: '#FAECE9',
      primary: '#FF5C5C',
      primaryHover: '#E84242',
      primaryLight: '#FFF0EE',
      secondary: '#FF8585',
      success: '#42A36B',
      successLight: '#EEF8F2',
      warning: '#FFC857',
      warningLight: '#FFF9ED',
      danger: '#D63333',
      dangerLight: '#FDF0F0',
    },
  },
};

/**
 * Strict Design Tokens
 */
export const DESIGN_TOKENS = {
  radius: {
    button: '8px',
    input: '8px',
    card: '12px',
    modal: '14px',
    panel: '16px',
  },
  typography: {
    dashboardTitle: 'text-[32px] font-bold tracking-tight leading-tight',
    sectionTitle: 'text-[20px] font-semibold tracking-tight leading-snug',
    cardMetric: 'text-[28px] font-bold tracking-tight',
    body: 'text-[14px] leading-relaxed',
    bodyMuted: 'text-[14px] text-[var(--color-muted)] leading-relaxed',
    label: 'text-[12px] font-semibold uppercase tracking-wider',
    table: 'text-[13px] leading-normal',
  },
  transitions: {
    default: 'transition-all duration-200 ease-in-out',
    fast: 'transition-all duration-150 ease-in-out',
  },
};

import { getFontFamilyVar, getTypographyPreset } from "./font-presets";

/**
 * Rich Digital Menu Visual Effects & Theme Tokens
 * Digital Menu uses tailored gradients, ambient blooms, contoured glass, and luminous buttons.
 */
export interface DigitalMenuVisualTheme {
  id: string;
  name: string;
  backdropBase: string;
  radialBloom: string;
  radialWarmth: string;
  radialGlow: string;
  accentSurface: string;
  accentSurfaceText: string;
  accentSurfaceSubtext: string;
  buttonGradient: string;
  buttonShadow: string;
  bottomFade: string;
  dockBg: string;
  dockActiveGradient: string;
  dockActiveShadow: string;
  avatarFallbackBg: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  bannerGradient: string;
  cardBg: string;
  offerHeroBg: string;
  offerHeroShadow: string;
}

export const DIGITAL_MENU_THEMES: Record<string, DigitalMenuVisualTheme> = {
  roast: {
    id: "roast",
    name: "Roast",
    backdropBase: "from-[#D89B72]/30 via-[#E4B896]/20 via-60% to-transparent",
    radialBloom: "from-[#B37850]/40 via-[#D89B72]/25 to-transparent",
    radialWarmth: "#FBF2E8",
    radialGlow: "#CCA07A",
    accentSurface: "#F5ECE3",
    accentSurfaceText: "#5C3C24",
    accentSurfaceSubtext: "#8B5E3C",
    buttonGradient: "from-[#754C30] via-[#8B5E3C] to-[#A8744F]",
    buttonShadow: "rgba(139, 94, 60, 0.16)",
    bottomFade: "from-white/95 via-white/70 to-transparent",
    dockBg: "#F8F3EE",
    dockActiveGradient: "from-[#684124] via-[#8B5E3C] to-[#A8744F]",
    dockActiveShadow: "rgba(139, 94, 60, 0.12)",
    avatarFallbackBg: "#8B5E3C",
    badgeBg: "rgba(139, 94, 60, 0.12)",
    badgeText: "#5C3C24",
    badgeBorder: "rgba(139, 94, 60, 0.25)",
    bannerGradient: "from-[#FAF4EE] via-[#FFFFFF] to-[#F5ECE3]",
    cardBg: "#FAF6F1",
    offerHeroBg: "#2B1B17",
    offerHeroShadow: "rgba(43, 27, 23, 0.24)",
  },
  bakery: {
    id: "bakery",
    name: "Bakery",
    backdropBase: "from-[#E8A598]/30 via-[#F2C0B7]/20 via-60% to-transparent",
    radialBloom: "from-[#D47E6F]/40 via-[#E8A598]/25 to-transparent",
    radialWarmth: "#FDF1EE",
    radialGlow: "#F2C0B7",
    accentSurface: "#FDF0ED",
    accentSurfaceText: "#7A362B",
    accentSurfaceSubtext: "#C46D5E",
    buttonGradient: "from-[#A85749] via-[#C46D5E] to-[#DC8576]",
    buttonShadow: "rgba(196, 109, 94, 0.16)",
    bottomFade: "from-white/95 via-white/70 to-transparent",
    dockBg: "#FCF3F1",
    dockActiveGradient: "from-[#9E4537] via-[#C46D5E] to-[#DC8576]",
    dockActiveShadow: "rgba(196, 109, 94, 0.12)",
    avatarFallbackBg: "#C46D5E",
    badgeBg: "rgba(196, 109, 94, 0.12)",
    badgeText: "#7A362B",
    badgeBorder: "rgba(196, 109, 94, 0.25)",
    bannerGradient: "from-[#FCF4F2] via-[#FFFFFF] to-[#FBF0ED]",
    cardBg: "#FCF7F4",
    offerHeroBg: "#2E1815",
    offerHeroShadow: "rgba(46, 24, 21, 0.24)",
  },
  garden: {
    id: "garden",
    name: "Garden",
    backdropBase: "from-[#8CBF76]/35 via-[#9ECB8A]/25 via-60% to-transparent",
    radialBloom: "from-[#7DAE63]/45 via-[#96C77F]/30 to-transparent",
    radialWarmth: "#EBF6D2",
    radialGlow: "#82B66C",
    accentSurface: "#DCEBD6",
    accentSurfaceText: "#254530",
    accentSurfaceSubtext: "#3F6E50",
    buttonGradient: "from-[#31573F] via-[#3F6E50] to-[#558B68]",
    buttonShadow: "rgba(63, 110, 80, 0.16)",
    bottomFade: "from-white/95 via-white/70 to-transparent",
    dockBg: "#EDF5EA",
    dockActiveGradient: "from-[#2B4B36] via-[#3F6E50] to-[#558B68]",
    dockActiveShadow: "rgba(63, 110, 80, 0.12)",
    avatarFallbackBg: "#3F6E50",
    badgeBg: "rgba(63, 110, 80, 0.12)",
    badgeText: "#254530",
    badgeBorder: "rgba(63, 110, 80, 0.25)",
    bannerGradient: "from-[#F5F8F4] via-[#FFFFFF] to-[#EFF5ED]",
    cardBg: "#F5F8F4",
    offerHeroBg: "#192D20",
    offerHeroShadow: "rgba(25, 45, 32, 0.24)",
  },
  noir: {
    id: "noir",
    name: "Noir",
    backdropBase: "from-[#A8A29E]/30 via-[#D6D3D1]/20 via-60% to-transparent",
    radialBloom: "from-[#78716C]/35 via-[#B8863B]/20 to-transparent",
    radialWarmth: "#F5F5F4",
    radialGlow: "#D6D3D1",
    accentSurface: "#ECEAE7",
    accentSurfaceText: "#1C1917",
    accentSurfaceSubtext: "#57534E",
    buttonGradient: "from-[#1C1917] via-[#292524] to-[#44403C]",
    buttonShadow: "rgba(41, 37, 36, 0.16)",
    bottomFade: "from-white/95 via-white/70 to-transparent",
    dockBg: "#F0EFEB",
    dockActiveGradient: "from-[#141211] via-[#292524] to-[#44403C]",
    dockActiveShadow: "rgba(41, 37, 36, 0.12)",
    avatarFallbackBg: "#292524",
    badgeBg: "rgba(41, 37, 36, 0.10)",
    badgeText: "#1C1917",
    badgeBorder: "rgba(41, 37, 36, 0.20)",
    bannerGradient: "from-[#F5F5F4] via-[#FFFFFF] to-[#ECEAE7]",
    cardBg: "#F6F5F4",
    offerHeroBg: "#1C1917",
    offerHeroShadow: "rgba(28, 25, 23, 0.24)",
  },
  play: {
    id: "play",
    name: "Play",
    backdropBase: "from-[#FF9066]/35 via-[#FFA985]/25 via-60% to-transparent",
    radialBloom: "from-[#F06E47]/45 via-[#FFA07A]/30 to-transparent",
    radialWarmth: "#FFE2D4",
    radialGlow: "#FFB894",
    accentSurface: "#FCEEE6",
    accentSurfaceText: "#8C2C10",
    accentSurfaceSubtext: "#D95D39",
    buttonGradient: "from-[#BD4826] via-[#D95D39] to-[#EA734F]",
    buttonShadow: "rgba(217, 93, 57, 0.16)",
    bottomFade: "from-white/95 via-white/70 to-transparent",
    dockBg: "#FCF3F0",
    dockActiveGradient: "from-[#A93818] via-[#D95D39] to-[#EA734F]",
    dockActiveShadow: "rgba(217, 93, 57, 0.12)",
    avatarFallbackBg: "#D95D39",
    badgeBg: "rgba(217, 93, 57, 0.12)",
    badgeText: "#8C2C10",
    badgeBorder: "rgba(217, 93, 57, 0.25)",
    bannerGradient: "from-[#FCF4F0] via-[#FFFFFF] to-[#FCEEE6]",
    cardBg: "#FAF5F0",
    offerHeroBg: "#2F150E",
    offerHeroShadow: "rgba(47, 21, 14, 0.24)",
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    backdropBase: "from-[#30AFFF]/25 via-[#67C5F2]/20 via-60% to-transparent",
    radialBloom: "from-[#30AFFF]/35 via-[#67C5F2]/20 to-transparent",
    radialWarmth: "#EAF7FF",
    radialGlow: "#BCE4FC",
    accentSurface: "#E9F6FD",
    accentSurfaceText: "#104F75",
    accentSurfaceSubtext: "#30AFFF",
    buttonGradient: "from-[#1E97E3] via-[#30AFFF] to-[#59BDFA]",
    buttonShadow: "rgba(48, 175, 255, 0.20)",
    bottomFade: "from-white/95 via-white/70 to-transparent",
    dockBg: "#EFF8FD",
    dockActiveGradient: "from-[#1681C4] via-[#30AFFF] to-[#59BDFA]",
    dockActiveShadow: "rgba(48, 175, 255, 0.16)",
    avatarFallbackBg: "#30AFFF",
    badgeBg: "rgba(48, 175, 255, 0.12)",
    badgeText: "#104F75",
    badgeBorder: "rgba(48, 175, 255, 0.25)",
    bannerGradient: "from-[#F0F8FD] via-[#FFFFFF] to-[#E8F5FC]",
    cardBg: "#F5FAFD",
    offerHeroBg: "#0F2333",
    offerHeroShadow: "rgba(15, 35, 51, 0.24)",
  },
  sun: {
    id: "sun",
    name: "Sun",
    backdropBase: "from-[#FFC83D]/30 via-[#FFD96A]/20 via-60% to-transparent",
    radialBloom: "from-[#FFB914]/40 via-[#FFD96A]/25 to-transparent",
    radialWarmth: "#FFF8E1",
    radialGlow: "#FFE699",
    accentSurface: "#FFF8E8",
    accentSurfaceText: "#664D00",
    accentSurfaceSubtext: "#B88600",
    buttonGradient: "from-[#E5AE20] via-[#FFC83D] to-[#FFD56B]",
    buttonShadow: "rgba(255, 200, 61, 0.25)",
    bottomFade: "from-white/95 via-white/70 to-transparent",
    dockBg: "#FFFBF0",
    dockActiveGradient: "from-[#C7930E] via-[#FFC83D] to-[#FFD56B]",
    dockActiveShadow: "rgba(255, 200, 61, 0.18)",
    avatarFallbackBg: "#FFC83D",
    badgeBg: "rgba(255, 200, 61, 0.16)",
    badgeText: "#664D00",
    badgeBorder: "rgba(255, 200, 61, 0.35)",
    bannerGradient: "from-[#FFFDF5] via-[#FFFFFF] to-[#FFF8E6]",
    cardBg: "#FFFCF4",
    offerHeroBg: "#2A200E",
    offerHeroShadow: "rgba(42, 32, 14, 0.24)",
  },
  blush: {
    id: "blush",
    name: "Blush",
    backdropBase: "from-[#FF6FAE]/25 via-[#FF9BC5]/20 via-60% to-transparent",
    radialBloom: "from-[#F25599]/35 via-[#FF9BC5]/25 to-transparent",
    radialWarmth: "#FFF0F6",
    radialGlow: "#FFD4E5",
    accentSurface: "#FFF0F6",
    accentSurfaceText: "#7A1E4B",
    accentSurfaceSubtext: "#FF6FAE",
    buttonGradient: "from-[#E85596] via-[#FF6FAE] to-[#FF8DC0]",
    buttonShadow: "rgba(255, 111, 174, 0.20)",
    bottomFade: "from-white/95 via-white/70 to-transparent",
    dockBg: "#FFF2F7",
    dockActiveGradient: "from-[#C93375] via-[#FF6FAE] to-[#FF8DC0]",
    dockActiveShadow: "rgba(255, 111, 174, 0.16)",
    avatarFallbackBg: "#FF6FAE",
    badgeBg: "rgba(255, 111, 174, 0.12)",
    badgeText: "#7A1E4B",
    badgeBorder: "rgba(255, 111, 174, 0.25)",
    bannerGradient: "from-[#FFF5F9] via-[#FFFFFF] to-[#FFEBF3]",
    cardBg: "#FFF7FA",
    offerHeroBg: "#2E1320",
    offerHeroShadow: "rgba(46, 19, 32, 0.24)",
  },
  lavender: {
    id: "lavender",
    name: "Lavender",
    backdropBase: "from-[#9B6DFF]/25 via-[#B89AFF]/20 via-60% to-transparent",
    radialBloom: "from-[#8550FA]/35 via-[#B89AFF]/25 to-transparent",
    radialWarmth: "#F4EFFF",
    radialGlow: "#DFD1FF",
    accentSurface: "#F4EFFF",
    accentSurfaceText: "#432185",
    accentSurfaceSubtext: "#9B6DFF",
    buttonGradient: "from-[#8350F2] via-[#9B6DFF] to-[#B592FF]",
    buttonShadow: "rgba(155, 109, 255, 0.20)",
    bottomFade: "from-white/95 via-white/70 to-transparent",
    dockBg: "#F5F1FF",
    dockActiveGradient: "from-[#6A32DF] via-[#9B6DFF] to-[#B592FF]",
    dockActiveShadow: "rgba(155, 109, 255, 0.16)",
    avatarFallbackBg: "#9B6DFF",
    badgeBg: "rgba(155, 109, 255, 0.12)",
    badgeText: "#432185",
    badgeBorder: "rgba(155, 109, 255, 0.25)",
    bannerGradient: "from-[#F7F4FF] via-[#FFFFFF] to-[#EFEAFF]",
    cardBg: "#F9F7FF",
    offerHeroBg: "#1D1333",
    offerHeroShadow: "rgba(29, 19, 51, 0.24)",
  },
  coral: {
    id: "coral",
    name: "Coral",
    backdropBase: "from-[#FF5C5C]/25 via-[#FF8585]/20 via-60% to-transparent",
    radialBloom: "from-[#F04343]/35 via-[#FF8585]/25 to-transparent",
    radialWarmth: "#FFF0ED",
    radialGlow: "#FFCFC9",
    accentSurface: "#FFF0ED",
    accentSurfaceText: "#7D1F1F",
    accentSurfaceSubtext: "#FF5C5C",
    buttonGradient: "from-[#E84242] via-[#FF5C5C] to-[#FF7D7D]",
    buttonShadow: "rgba(255, 92, 92, 0.20)",
    bottomFade: "from-white/95 via-white/70 to-transparent",
    dockBg: "#FFF2EF",
    dockActiveGradient: "from-[#C72A2A] via-[#FF5C5C] to-[#FF7D7D]",
    dockActiveShadow: "rgba(255, 92, 92, 0.16)",
    avatarFallbackBg: "#FF5C5C",
    badgeBg: "rgba(255, 92, 92, 0.12)",
    badgeText: "#7D1F1F",
    badgeBorder: "rgba(255, 92, 92, 0.25)",
    bannerGradient: "from-[#FFF5F2] via-[#FFFFFF] to-[#FFEBE6]",
    cardBg: "#FFF7F5",
    offerHeroBg: "#2E1212",
    offerHeroShadow: "rgba(46, 18, 18, 0.24)",
  },
};

export function getDigitalMenuVisualTheme(presetId: string = "roast"): DigitalMenuVisualTheme {
  return DIGITAL_MENU_THEMES[presetId] || DIGITAL_MENU_THEMES.roast;
}

/**
 * Generate CSS variable overrides for a chosen café theme preset and font family
 */
export function getCafeThemeStyles(
  presetId: string = 'roast',
  fontFamilyId?: string | null
): Record<string, string> {
  const preset = CAFE_THEME_PRESETS[presetId] || CAFE_THEME_PRESETS.roast;
  const menuVisual = getDigitalMenuVisualTheme(presetId);
  const typography = getTypographyPreset(fontFamilyId || preset.fontFamily);

  return {
    fontFamily: typography.bodyFontVar,
    '--font-family-current': typography.bodyFontVar,
    '--cafe-font-family': typography.bodyFontVar,
    '--font-heading': typography.headingFontVar,
    '--font-body': typography.bodyFontVar,
    '--cafe-font-heading': typography.headingFontVar,
    '--cafe-font-body': typography.bodyFontVar,

    '--cafe-background': preset.colors.background,
    '--cafe-surface': preset.colors.surface,
    '--cafe-foreground': preset.colors.foreground,
    '--cafe-muted': preset.colors.muted,
    '--cafe-border': preset.colors.border,
    '--cafe-border-subtle': preset.colors.borderSubtle,
    '--cafe-primary': preset.colors.primary,
    '--cafe-primary-hover': preset.colors.primaryHover,
    '--cafe-primary-light': preset.colors.primaryLight,
    '--cafe-secondary': preset.colors.secondary || '#D89B72',
    '--cafe-success': preset.colors.success,
    '--cafe-success-light': preset.colors.successLight,
    '--cafe-warning': preset.colors.warning,
    '--cafe-warning-light': preset.colors.warningLight,
    '--cafe-danger': preset.colors.danger,
    '--cafe-danger-light': preset.colors.dangerLight,

    // Provide --color-* aliases for direct component compatibility
    '--color-background': preset.colors.background,
    '--color-surface': preset.colors.surface,
    '--color-foreground': preset.colors.foreground,
    '--color-muted': preset.colors.muted,
    '--color-border': preset.colors.border,
    '--color-border-subtle': preset.colors.borderSubtle,
    '--color-primary': preset.colors.primary,
    '--color-primary-hover': preset.colors.primaryHover,
    '--color-primary-light': preset.colors.primaryLight,
    '--color-success': preset.colors.success,
    '--color-success-light': preset.colors.successLight,
    '--color-warning': preset.colors.warning,
    '--color-warning-light': preset.colors.warningLight,
    '--color-danger': preset.colors.danger,
    '--color-danger-light': preset.colors.dangerLight,

    // Rich digital menu tokens
    '--menu-accent-surface': menuVisual.accentSurface,
    '--menu-accent-surface-text': menuVisual.accentSurfaceText,
    '--menu-accent-surface-subtext': menuVisual.accentSurfaceSubtext,
    '--menu-radial-warmth': menuVisual.radialWarmth,
    '--menu-radial-glow': menuVisual.radialGlow,
    '--menu-avatar-fallback': menuVisual.avatarFallbackBg,
    '--menu-dock-bg': menuVisual.dockBg,
    '--menu-card-bg': menuVisual.cardBg,
  };
}
