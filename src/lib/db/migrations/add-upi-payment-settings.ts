import { db } from "../index";

async function main() {
  console.log("Adding UPI payment settings columns to cafe_settings and orders...");

  await db.execute(`
    ALTER TABLE cafe_settings 
    ADD COLUMN IF NOT EXISTS upi_id text,
    ADD COLUMN IF NOT EXISTS upi_merchant_name text,
    ADD COLUMN IF NOT EXISTS upi_qr_url text,
    ADD COLUMN IF NOT EXISTS upi_qr_key text;

    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_verified_at timestamp,
    ADD COLUMN IF NOT EXISTS payment_rejected_at timestamp;
  `);

  console.log("Successfully added UPI payment columns to database!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
