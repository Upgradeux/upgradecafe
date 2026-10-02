import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function main() {
  console.log("Creating floors table and adding live table activity fields...");

  // 1. Create floors table
  await sql`
    CREATE TABLE IF NOT EXISTS "floors" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "cafe_id" uuid NOT NULL REFERENCES "cafes"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "slug" text NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS "floors_cafe_id_idx" ON "floors"("cafe_id");`;

  // 2. Add columns to tables
  await sql`
    ALTER TABLE "tables"
    ADD COLUMN IF NOT EXISTS "floor_id" uuid REFERENCES "floors"("id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "current_guests" integer,
    ADD COLUMN IF NOT EXISTS "occupied_since_minutes" integer,
    ADD COLUMN IF NOT EXISTS "current_bill_amount" integer,
    ADD COLUMN IF NOT EXISTS "reserved_for_time" text,
    ADD COLUMN IF NOT EXISTS "notes" text;
  `;
  await sql`CREATE INDEX IF NOT EXISTS "tables_floor_id_idx" ON "tables"("floor_id");`;

  // 3. Seed default floors for The Roasted Bean
  const [cafe] = await sql`SELECT id FROM cafes WHERE slug = 'the-roasted-bean' LIMIT 1`;
  if (cafe) {
    console.log("Seeding floors and live activity for The Roasted Bean...");

    // Create Main Dining Floor
    const [mainFloor] = await sql`
      INSERT INTO "floors" (cafe_id, name, slug, sort_order)
      VALUES (${cafe.id}, 'Main Indoor Dining', 'main-indoor', 1)
      ON CONFLICT DO NOTHING
      RETURNING id;
    `;

    // Create Terrace Floor
    const [terraceFloor] = await sql`
      INSERT INTO "floors" (cafe_id, name, slug, sort_order)
      VALUES (${cafe.id}, 'Outdoor Patio & Balcony', 'outdoor-patio', 2)
      ON CONFLICT DO NOTHING
      RETURNING id;
    `;

    // Query floors
    const floorsList = await sql`SELECT id, slug FROM floors WHERE cafe_id = ${cafe.id}`;
    const mainId = floorsList.find(f => f.slug === 'main-indoor')?.id;
    const terraceId = floorsList.find(f => f.slug === 'outdoor-patio')?.id;

    if (mainId) {
      await sql`
        UPDATE tables
        SET floor_id = ${mainId}
        WHERE cafe_id = ${cafe.id} AND table_number IN ('Table 01', 'Table 02', 'Table 03', 'Community Table');
      `;
    }

    if (terraceId) {
      await sql`
        UPDATE tables
        SET floor_id = ${terraceId}
        WHERE cafe_id = ${cafe.id} AND table_number IN ('Table 04', 'Balcony 01');
      `;
    }

    // Set realistic live floor activity
    // Table 02: Occupied 2 guests, ₹840, 24 min
    await sql`
      UPDATE tables
      SET status = 'OCCUPIED', current_guests = 2, occupied_since_minutes = 24, current_bill_amount = 840
      WHERE cafe_id = ${cafe.id} AND table_number = 'Table 02';
    `;

    // Table 04: Occupied / Attention table: 4 guests, ₹1,240, 41 min
    await sql`
      UPDATE tables
      SET status = 'OCCUPIED', current_guests = 4, occupied_since_minutes = 41, current_bill_amount = 1240
      WHERE cafe_id = ${cafe.id} AND table_number = 'Table 04';
    `;

    // Balcony 01: Reserved for 7:30 PM
    await sql`
      UPDATE tables
      SET status = 'RESERVED', reserved_for_time = '7:30 PM', notes = 'Anniversary celebration for Mr. Kapoor'
      WHERE cafe_id = ${cafe.id} AND table_number = 'Balcony 01';
    `;
  }

  console.log("✓ Floors & live activity successfully created and populated!");
  await sql.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
