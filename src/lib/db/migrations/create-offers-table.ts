import { db } from "../index";
import { cafes } from "../schema/cafes";
import { offers } from "../schema/offers";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Checking and creating offers table...");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS offers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE',
      discount_value INTEGER NOT NULL,
      min_order_amount INTEGER DEFAULT 0,
      applies_to TEXT NOT NULL DEFAULT 'ALL',
      badge_text TEXT DEFAULT 'Limited Time',
      image_url TEXT,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS offers_cafe_id_idx ON offers(cafe_id);
    CREATE INDEX IF NOT EXISTS offers_code_cafe_id_idx ON offers(cafe_id, code);
  `);

  console.log("Offers table verified.");

  // Check if each cafe has default sample offers seeded
  const allCafes = await db.select({ id: cafes.id, name: cafes.name }).from(cafes);
  for (const cafe of allCafes) {
    const existing = await db.select().from(offers).where(eq(offers.cafeId, cafe.id)).limit(1);
    if (existing.length === 0) {
      console.log(`Seeding initial offers for cafe: ${cafe.name} (${cafe.id})`);
      await db.insert(offers).values([
        {
          cafeId: cafe.id,
          code: "WELCOME10",
          title: "First Table Visit Bonus",
          description: "Get 10% OFF on all handcrafted coffee, coolers, & meals.",
          discountType: "PERCENTAGE" as const,
          discountValue: 10,
          minOrderAmount: 0,
          appliesTo: "ALL" as const,
          customerEligibility: "ALL" as const,
          freeItemUnlockType: "SPEND" as const,
          applicationMethod: "COUPON_CODE" as const,
          badgeText: "Popular",
          isActive: true,
        },
        {
          cafeId: cafe.id,
          code: "FLAT50",
          title: "Artisanal Brew Savings",
          description: "Flat ₹50 OFF on any order above ₹250.",
          discountType: "FLAT" as const,
          discountValue: 50,
          minOrderAmount: 250,
          appliesTo: "CATEGORIES" as const,
          customerEligibility: "ALL" as const,
          freeItemUnlockType: "SPEND" as const,
          applicationMethod: "COUPON_CODE" as const,
          badgeText: "Limited Time",
          isActive: true,
        },
        {
          cafeId: cafe.id,
          code: "CHEF20",
          title: "Chef's Signature Perk",
          description: "20% OFF when ordering signature roasts or bakery specials.",
          discountType: "PERCENTAGE" as const,
          discountValue: 20,
          minOrderAmount: 300,
          appliesTo: "CATEGORIES" as const,
          customerEligibility: "ALL" as const,
          freeItemUnlockType: "SPEND" as const,
          applicationMethod: "COUPON_CODE" as const,
          badgeText: "Chef's Pick",
          isActive: true,
        },
      ]);
    }
  }

  console.log("Offers migration and seeding completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
