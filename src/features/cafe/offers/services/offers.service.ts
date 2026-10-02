import { db } from "@/lib/db";
import { offers, Offer, NewOffer, DiscountType, OfferOrderType } from "@/lib/db/schema/offers";
import { eq, and, desc } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";

export class OffersService {
  /**
   * List active offers for public customer view
   */
  static async listActiveOffers(cafeId: string): Promise<Offer[]> {
    return await db
      .select()
      .from(offers)
      .where(and(eq(offers.cafeId, cafeId), eq(offers.isActive, true)))
      .orderBy(desc(offers.createdAt));
  }

  /**
   * List all offers (for cafe management)
   */
  static async listAllOffers(cafeId: string): Promise<Offer[]> {
    return await db
      .select()
      .from(offers)
      .where(eq(offers.cafeId, cafeId))
      .orderBy(desc(offers.createdAt));
  }

  /**
   * Get single offer by ID
   */
  static async getOfferById(cafeId: string, offerId: string): Promise<Offer | null> {
    const [offer] = await db
      .select()
      .from(offers)
      .where(and(eq(offers.cafeId, cafeId), eq(offers.id, offerId)))
      .limit(1);
    return offer || null;
  }

  /**
   * Create new offer
   */
  static async createOffer(
    cafeId: string,
    data: {
      code: string;
      title: string;
      description?: string;
      discountType?: DiscountType;
      discountValue: number;
      maxDiscountAmount?: number | null;
      minOrderAmount?: number;
      rewardItemId?: string | null;
      rewardItemName?: string | null;
      applicationMethod?: "AUTOMATIC" | "COUPON_CODE";
      appliesTo?: "ALL" | "CATEGORIES" | "ITEMS";
      targetCategoryIds?: string | null;
      targetItemIds?: string | null;
      customerEligibility?: "ALL" | "NEW" | "RETURNING" | "LOYALTY";
      usageLimitTotal?: number | null;
      usageLimitPerCustomer?: number | null;
      timeStart?: string | null;
      timeEnd?: string | null;
      daysOfWeek?: string | null;
      availableChannels?: string;
      applicableOrderType?: OfferOrderType;
      cannotCombine?: boolean;
      freeItemUnlockType?: "SPEND" | "CATEGORY" | "ITEM";
      freeItemQualifyingCategoryId?: string | null;
      freeItemQualifyingItemId?: string | null;
      badgeText?: string;
      imageUrl?: string;
      startDate?: Date | null;
      endDate?: Date | null;
      isActive?: boolean;
    }
  ): Promise<Offer> {
    const [created] = await db
      .insert(offers)
      .values({
        cafeId,
        code: data.code.toUpperCase().trim(),
        title: data.title.trim(),
        description: data.description?.trim(),
        discountType: data.discountType || "PERCENTAGE",
        discountValue: data.discountValue,
        maxDiscountAmount: data.maxDiscountAmount || null,
        minOrderAmount: data.minOrderAmount || 0,
        rewardItemId: data.rewardItemId || null,
        rewardItemName: data.rewardItemName || null,
        applicationMethod: data.applicationMethod || "COUPON_CODE",
        appliesTo: data.appliesTo || "ALL",
        targetCategoryIds: data.targetCategoryIds || null,
        targetItemIds: data.targetItemIds || null,
        customerEligibility: data.customerEligibility || "ALL",
        usageLimitTotal: data.usageLimitTotal || null,
        usageLimitPerCustomer: data.usageLimitPerCustomer ?? 1,
        timeStart: data.timeStart || null,
        timeEnd: data.timeEnd || null,
        daysOfWeek: data.daysOfWeek || null,
        availableChannels: data.availableChannels || "DIGITAL_MENU,POS",
        applicableOrderType: data.applicableOrderType || "BOTH",
        cannotCombine: data.cannotCombine ?? true,
        freeItemUnlockType: data.freeItemUnlockType || "SPEND",
        freeItemQualifyingCategoryId: data.freeItemQualifyingCategoryId || null,
        freeItemQualifyingItemId: data.freeItemQualifyingItemId || null,
        badgeText: data.badgeText?.trim() || "Special Offer",
        imageUrl: data.imageUrl,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? true,
      })
      .returning();

    return created;
  }

  /**
   * Update an existing offer
   */
  static async updateOffer(
    cafeId: string,
    offerId: string,
    data: Partial<{
      code: string;
      title: string;
      description: string;
      discountType: DiscountType;
      discountValue: number;
      maxDiscountAmount: number | null;
      minOrderAmount: number;
      rewardItemId: string | null;
      rewardItemName: string | null;
      applicationMethod: "AUTOMATIC" | "COUPON_CODE";
      appliesTo: "ALL" | "CATEGORIES" | "ITEMS";
      targetCategoryIds: string | null;
      targetItemIds: string | null;
      customerEligibility: "ALL" | "NEW" | "RETURNING" | "LOYALTY";
      usageLimitTotal: number | null;
      usageLimitPerCustomer: number | null;
      timeStart: string | null;
      timeEnd: string | null;
      daysOfWeek: string | null;
      availableChannels: string;
      applicableOrderType: OfferOrderType;
      cannotCombine: boolean;
      freeItemUnlockType: "SPEND" | "CATEGORY" | "ITEM";
      freeItemQualifyingCategoryId: string | null;
      freeItemQualifyingItemId: string | null;
      badgeText: string;
      imageUrl: string;
      startDate: Date | null;
      endDate: Date | null;
      isActive: boolean;
    }>
  ): Promise<Offer> {
    const existing = await this.getOfferById(cafeId, offerId);
    if (!existing) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Offer not found",
        statusCode: 404,
      });
    }

    const [updated] = await db
      .update(offers)
      .set({
        ...data,
        code: data.code ? data.code.toUpperCase().trim() : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(offers.cafeId, cafeId), eq(offers.id, offerId)))
      .returning();

    return updated;
  }

  /**
   * Delete an offer
   */
  static async deleteOffer(cafeId: string, offerId: string): Promise<boolean> {
    const result = await db
      .delete(offers)
      .where(and(eq(offers.cafeId, cafeId), eq(offers.id, offerId)))
      .returning();

    return result.length > 0;
  }
}
