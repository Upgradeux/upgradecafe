import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UpgradeCafé Digital Menu",
    short_name: "Café Menu",
    description: "Scan, browse artisanal cafe menu, customize items, order and track live from your table.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9F6",
    theme_color: "#8B5E3C",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
