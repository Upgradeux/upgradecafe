import { db } from "../index";

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

  console.log("Offers table migration completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
