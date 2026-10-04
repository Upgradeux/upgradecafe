import { db } from "../index";

async function main() {
  console.log("Adding image_url column to categories table...");

  await db.execute(`
    ALTER TABLE categories 
    ADD COLUMN IF NOT EXISTS image_url text;
  `);

  console.log("Successfully added image_url column to categories!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
