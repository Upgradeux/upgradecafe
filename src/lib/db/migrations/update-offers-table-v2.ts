import { db } from "../index";

async function main() {
  console.log("Adding new fields to offers table if not exist...");

  await db.execute(`
    ALTER TABLE offers
      ADD COLUMN IF NOT EXISTS application_method TEXT NOT NULL DEFAULT 'COUPON_CODE',
      ADD COLUMN IF NOT EXISTS max_discount_amount INTEGER,
      ADD COLUMN IF NOT EXISTS reward_item_id UUID,
      ADD COLUMN IF NOT EXISTS reward_item_name TEXT;
  `);

  console.log("Offers table updated with application_method, max_discount_amount, reward_item_id, reward_item_name.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
