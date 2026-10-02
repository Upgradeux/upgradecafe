import { db } from "../index";

async function main() {
  console.log("Adding home_sections column to cafe_settings...");

  await db.execute(`
    ALTER TABLE cafe_settings 
    ADD COLUMN IF NOT EXISTS home_sections jsonb;
  `);

  console.log("Successfully added home_sections column!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
