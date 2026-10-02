import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function main() {
  console.log("Adding columns to menu_items table...");
  await sql`
    ALTER TABLE "menu_items"
    ADD COLUMN IF NOT EXISTS "food_type" text DEFAULT 'VEG' NOT NULL,
    ADD COLUMN IF NOT EXISTS "is_bestseller" boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS "is_spicy" boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS "temperature" text DEFAULT 'NOT_APPLICABLE' NOT NULL,
    ADD COLUMN IF NOT EXISTS "allergens" text,
    ADD COLUMN IF NOT EXISTS "calories" integer;
  `;
  console.log("Columns successfully added to menu_items!");
  await sql.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
