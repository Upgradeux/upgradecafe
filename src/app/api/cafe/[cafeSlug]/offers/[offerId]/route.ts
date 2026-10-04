import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { OffersService } from "@/features/cafe/offers/services/offers.service";
import { AppError } from "@/lib/errors/app-error";
import { invalidateCafePublicMenu } from "@/features/cafe/public-menu/services/public-menu-cache.service";
import { z } from "zod";

const updateOfferSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(300).optional(),
  discountType: z.enum(["PERCENTAGE", "FLAT", "FREE_ITEM"]).optional(),
  discountValue: z.coerce.number().int().min(0).optional(),
  maxDiscountAmount: z.coerce.number().int().min(0).optional().nullable(),
  minOrderAmount: z.coerce.number().int().min(0).optional(),
  rewardItemId: z.string().optional().nullable(),
  rewardItemName: z.string().optional().nullable(),
  applicationMethod: z.enum(["AUTOMATIC", "COUPON_CODE"]).optional(),
  appliesTo: z.enum(["ALL", "CATEGORIES", "ITEMS"]).optional(),
  targetCategoryIds: z.string().optional().nullable(),
  targetItemIds: z.string().optional().nullable(),
  customerEligibility: z.enum(["ALL", "NEW", "RETURNING", "LOYALTY"]).optional(),
  usageLimitTotal: z.coerce.number().int().min(1).optional().nullable(),
  usageLimitPerCustomer: z.coerce.number().int().min(1).optional(),
  timeStart: z.string().optional().nullable(),
  timeEnd: z.string().optional().nullable(),
  daysOfWeek: z.string().optional().nullable(),
  availableChannels: z.string().optional(),
  applicableOrderType: z.enum(["BOTH", "DINE_IN", "TAKEAWAY"]).optional(),
  cannotCombine: z.boolean().optional(),
  freeItemUnlockType: z.enum(["SPEND", "CATEGORY", "ITEM"]).optional(),
  freeItemQualifyingCategoryId: z.string().optional().nullable(),
  freeItemQualifyingItemId: z.string().optional().nullable(),
  badgeText: z.string().max(50).optional(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; offerId: string }> }
) {
  try {
    const { cafeSlug, offerId } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);
    const body = await request.json();

    const validated = updateOfferSchema.parse(body);
    const updated = await OffersService.updateOffer(cafe.id, offerId, {
      ...validated,
      imageUrl: validated.imageUrl === null ? undefined : validated.imageUrl,
    });
    invalidateCafePublicMenu(cafeSlug);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return AppError.toResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; offerId: string }> }
) {
  try {
    const { cafeSlug, offerId } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);

    const deleted = await OffersService.deleteOffer(cafe.id, offerId);
    if (!deleted) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Offer not found or already deleted",
        statusCode: 404,
      });
    }
    invalidateCafePublicMenu(cafeSlug);

    return NextResponse.json({ success: true });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
