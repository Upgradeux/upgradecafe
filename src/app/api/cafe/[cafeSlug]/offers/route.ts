import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { OffersService } from "@/features/cafe/offers/services/offers.service";
import { AppError } from "@/lib/errors/app-error";
import { invalidateCafePublicMenu } from "@/features/cafe/public-menu/services/public-menu-cache.service";
import { z } from "zod";

const createOfferSchema = z.object({
  code: z.string().min(2).max(50),
  title: z.string().min(2).max(100),
  description: z.string().max(300).optional(),
  discountType: z.enum(["PERCENTAGE", "FLAT", "FREE_ITEM"]).default("PERCENTAGE"),
  discountValue: z.coerce.number().int().min(0).default(0),
  maxDiscountAmount: z.coerce.number().int().min(0).optional().nullable(),
  minOrderAmount: z.coerce.number().int().min(0).default(0),
  rewardItemId: z.string().optional().nullable(),
  rewardItemName: z.string().optional().nullable(),
  applicationMethod: z.enum(["AUTOMATIC", "COUPON_CODE"]).default("COUPON_CODE"),
  appliesTo: z.enum(["ALL", "CATEGORIES", "ITEMS"]).default("ALL"),
  targetCategoryIds: z.string().optional().nullable(),
  targetItemIds: z.string().optional().nullable(),
  customerEligibility: z.enum(["ALL", "NEW", "RETURNING", "LOYALTY"]).default("ALL"),
  usageLimitTotal: z.coerce.number().int().min(1).optional().nullable(),
  usageLimitPerCustomer: z.coerce.number().int().min(1).default(1),
  timeStart: z.string().optional().nullable(),
  timeEnd: z.string().optional().nullable(),
  daysOfWeek: z.string().optional().nullable(),
  availableChannels: z.string().default("DIGITAL_MENU,POS"),
  applicableOrderType: z.enum(["BOTH", "DINE_IN", "TAKEAWAY"]).default("BOTH"),
  cannotCombine: z.boolean().default(true),
  freeItemUnlockType: z.enum(["SPEND", "CATEGORY", "ITEM"]).default("SPEND"),
  freeItemQualifyingCategoryId: z.string().optional().nullable(),
  freeItemQualifyingItemId: z.string().optional().nullable(),
  badgeText: z.string().max(50).optional(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug);
    
    // Check if query param includes inactive
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("all") === "true";

    const offersList = includeInactive
      ? await OffersService.listAllOffers(cafe.id)
      : await OffersService.listActiveOffers(cafe.id);

    return NextResponse.json({ success: true, data: offersList });
  } catch (err) {
    return AppError.toResponse(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);
    const body = await request.json();

    const validated = createOfferSchema.parse(body);
    const newOffer = await OffersService.createOffer(cafe.id, {
      ...validated,
      imageUrl: validated.imageUrl || undefined,
    });
    invalidateCafePublicMenu(cafeSlug);

    return NextResponse.json({ success: true, data: newOffer }, { status: 201 });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
