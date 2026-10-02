import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function main() {
  console.log("Adding nutrition columns to menu_items table...");
  await sql`
    ALTER TABLE "menu_items"
    ADD COLUMN IF NOT EXISTS "protein_grams" integer,
    ADD COLUMN IF NOT EXISTS "fat_grams" integer,
    ADD COLUMN IF NOT EXISTS "carbs_grams" integer;
  `;
  console.log("Nutrition columns successfully added to menu_items!");
  await sql.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
