import { db } from "./index";

async function main() {
  console.log("Running migration for cafe_settings digital menu engine columns...");

  await db.execute(`
    ALTER TABLE cafe_settings 
    ADD COLUMN IF NOT EXISTS layout_preset text DEFAULT 'modern_app' NOT NULL,
    ADD COLUMN IF NOT EXISTS enable_qr_ordering boolean DEFAULT true NOT NULL,
    ADD COLUMN IF NOT EXISTS enable_dine_in boolean DEFAULT true NOT NULL,
    ADD COLUMN IF NOT EXISTS enable_takeaway boolean DEFAULT true NOT NULL,
    ADD COLUMN IF NOT EXISTS allow_order_notes boolean DEFAULT true NOT NULL,
    ADD COLUMN IF NOT EXISTS enable_reviews boolean DEFAULT true NOT NULL,
    ADD COLUMN IF NOT EXISTS enable_offers boolean DEFAULT true NOT NULL,
    ADD COLUMN IF NOT EXISTS google_review_url text;
  `);

  console.log("Migration completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
