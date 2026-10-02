import * as dotenv from "dotenv";
dotenv.config();

import { db } from "../src/lib/db/index";
import { sql } from "drizzle-orm";

async function addPhoneColumns() {
  console.log("Adding phone_number and phone_number_verified columns to users table...");

  try {
    await db.execute(sql`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "phone_number" text,
      ADD COLUMN IF NOT EXISTS "phone_number_verified" boolean DEFAULT false
    `);
    console.log("✅ Columns added successfully.");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  }

  process.exit(0);
}

addPhoneColumns();
