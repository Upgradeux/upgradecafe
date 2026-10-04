import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { cafeSettings } from "@/lib/db/schema/cafe-settings";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;

    const [cafe] = await db
      .select({
        id: cafes.id,
        name: cafes.name,
        slug: cafes.slug,
        logoKey: cafes.logoKey,
      })
      .from(cafes)
      .where(eq(cafes.slug, cafeSlug))
      .limit(1);

    if (!cafe) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const [settings] = await db
      .select({
        primaryColor: cafeSettings.primaryColor,
      })
      .from(cafeSettings)
      .where(eq(cafeSettings.cafeId, cafe.id))
      .limit(1);

    const { buildCafeManifest } = await import("@/features/cafe/pwa/manifest-builder");

    const manifest = buildCafeManifest({
      name: cafe.name,
      slug: cafe.slug,
      logoKey: cafe.logoKey,
      primaryColor: settings?.primaryColor,
    });

    return NextResponse.json(manifest, {
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Error generating dynamic manifest:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
