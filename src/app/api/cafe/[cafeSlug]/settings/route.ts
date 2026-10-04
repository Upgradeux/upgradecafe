import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { db } from "@/lib/db";
import { cafeSettings } from "@/lib/db/schema/cafe-settings";
import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import { invalidateCafePublicMenu } from "@/features/cafe/public-menu/services/public-menu-cache.service";
import { z } from "zod";

const settingsPatchSchema = z.object({
  themePreset: z.enum(["roast", "bakery", "garden", "noir", "play", "ocean", "sun", "blush", "lavender", "coral"]).optional(),
  digitalMenuTheme: z.enum(["roast", "bakery", "garden", "noir", "play", "ocean", "sun", "blush", "lavender", "coral"]).optional(),
  layoutPreset: z.enum(["modern_app", "classic_list"]).optional(),
  primaryColor: z.string().optional().nullable(),
  secondaryColor: z.string().optional().nullable(),
  fontFamily: z.string().optional(),
  borderRadius: z.string().optional(),
  enableQrOrdering: z.boolean().optional(),
  enableDineIn: z.boolean().optional(),
  enableTakeaway: z.boolean().optional(),
  allowOrderNotes: z.boolean().optional(),
  enableReviews: z.boolean().optional(),
  enableOffers: z.boolean().optional(),
  googleReviewUrl: z.string().optional().nullable(),
  homeSections: z.array(z.any()).optional().nullable(),
  upiId: z.string().optional().nullable(),
  upiMerchantName: z.string().optional().nullable(),
  upiQrUrl: z.string().optional().nullable(),
  upiQrKey: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe, settings } = await resolveCafeTenant(cafeSlug);

    return NextResponse.json({
      success: true,
      data: settings || {
        cafeId: cafe.id,
        themePreset: "roast",
        digitalMenuTheme: "roast",
        layoutPreset: "modern_app",
        fontFamily: "Plus Jakarta Sans",
        borderRadius: "8px",
        enableQrOrdering: true,
        enableDineIn: true,
        enableTakeaway: true,
        allowOrderNotes: true,
        enableReviews: true,
        enableOffers: true,
        googleReviewUrl: null,
        homeSections: null,
        upiId: null,
        upiMerchantName: null,
        upiQrUrl: null,
        upiQrKey: null,
      },
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);
    const body = await request.json();

    const validated = settingsPatchSchema.parse(body);

    // Clean undefined values so PATCH only updates provided fields
    const updateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(validated)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    // Upsert settings
    const [existing] = await db
      .select()
      .from(cafeSettings)
      .where(eq(cafeSettings.cafeId, cafe.id))
      .limit(1);

    let updated;
    if (existing) {
      [updated] = await db
        .update(cafeSettings)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(cafeSettings.cafeId, cafe.id))
        .returning();
    } else {
      [updated] = await db
        .insert(cafeSettings)
        .values({
          cafeId: cafe.id,
          themePreset: validated.themePreset ?? "roast",
          digitalMenuTheme: validated.digitalMenuTheme ?? "roast",
          layoutPreset: validated.layoutPreset ?? "modern_app",
          fontFamily: validated.fontFamily ?? "Plus Jakarta Sans",
          borderRadius: validated.borderRadius ?? "8px",
          enableQrOrdering: validated.enableQrOrdering ?? true,
          enableDineIn: validated.enableDineIn ?? true,
          enableTakeaway: validated.enableTakeaway ?? true,
          allowOrderNotes: validated.allowOrderNotes ?? true,
          enableReviews: validated.enableReviews ?? true,
          enableOffers: validated.enableOffers ?? true,
          googleReviewUrl: validated.googleReviewUrl ?? null,
          homeSections: validated.homeSections ?? null,
          ...updateData,
        })
        .returning();
    }

    try {
      invalidateCafePublicMenu(cafeSlug);
      revalidatePath(`/menu/${cafeSlug}`);
      revalidatePath(`/menu/${cafeSlug}/[itemSlug]`, "page");
      revalidatePath(`/cafe/${cafeSlug}`);
      revalidatePath(`/cafe/${cafeSlug}/settings`);
    } catch {
      // Revalidation fallback
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
