export interface CafeManifestInput {
  name: string;
  slug: string;
  logoKey?: string | null;
  primaryColor?: string | null;
}

export interface PwaIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

export interface CafePwaManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  id: string;
  display: "standalone";
  orientation: "portrait";
  background_color: string;
  theme_color: string;
  icons: PwaIcon[];
}

export function buildCafeManifest(input: CafeManifestInput): CafePwaManifest {
  const themeColor = input.primaryColor || "#8B5E3C";
  const startUrl = `/menu/${input.slug}`;
  const scope = `/menu/${input.slug}/`;
  const id = `/menu/${input.slug}`;

  let iconSrc = "/logo/logo.png";
  let iconType = "image/png";

  if (input.logoKey) {
    iconSrc =
      input.logoKey.startsWith("http://") ||
      input.logoKey.startsWith("https://") ||
      input.logoKey.startsWith("/")
        ? input.logoKey
        : `/uploads/${input.logoKey}`;

    if (iconSrc.endsWith(".webp")) {
      iconType = "image/webp";
    } else if (iconSrc.endsWith(".svg")) {
      iconType = "image/svg+xml";
    } else if (iconSrc.endsWith(".jpg") || iconSrc.endsWith(".jpeg")) {
      iconType = "image/jpeg";
    }
  }

  return {
    name: input.name,
    short_name: input.name.length > 20 ? input.name.slice(0, 20) : input.name,
    description: `Order live from ${input.name}`,
    start_url: startUrl,
    scope: scope,
    id: id,
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF9F6",
    theme_color: themeColor,
    icons: [
      {
        src: iconSrc,
        sizes: "192x192",
        type: iconType,
        purpose: "any maskable",
      },
      {
        src: iconSrc,
        sizes: "512x512",
        type: iconType,
        purpose: "any maskable",
      },
    ],
  };
}

/**
 * Checks if a given URL is within the PWA scope of a specific cafe.
 */
export function isUrlInCafePwaScope(url: string, cafeSlug: string): boolean {
  const scope = `/menu/${cafeSlug}/`;
  const cleanUrl = url.split("?")[0].split("#")[0];
  const urlWithTrailing = cleanUrl.endsWith("/") ? cleanUrl : `${cleanUrl}/`;
  return urlWithTrailing.startsWith(scope);
}
