import { db } from "../index";

async function main() {
  console.log("Adding smart offer controls to offers table if not exist...");

  await db.execute(`
    ALTER TABLE offers
      ADD COLUMN IF NOT EXISTS target_category_ids TEXT,
      ADD COLUMN IF NOT EXISTS target_item_ids TEXT,
      ADD COLUMN IF NOT EXISTS customer_eligibility TEXT NOT NULL DEFAULT 'ALL',
      ADD COLUMN IF NOT EXISTS usage_limit_total INTEGER,
      ADD COLUMN IF NOT EXISTS usage_limit_per_customer INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS time_start TEXT,
      ADD COLUMN IF NOT EXISTS time_end TEXT,
      ADD COLUMN IF NOT EXISTS days_of_week TEXT,
      ADD COLUMN IF NOT EXISTS available_channels TEXT NOT NULL DEFAULT 'DIGITAL_MENU,POS',
      ADD COLUMN IF NOT EXISTS cannot_combine BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS free_item_unlock_type TEXT NOT NULL DEFAULT 'SPEND',
      ADD COLUMN IF NOT EXISTS free_item_qualifying_category_id UUID,
      ADD COLUMN IF NOT EXISTS free_item_qualifying_item_id UUID;
  `);

  console.log("Offers table successfully updated with advanced promotion rules.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
