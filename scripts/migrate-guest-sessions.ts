import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Migrating database for guest_sessions...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS guest_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
      table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
      customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      session_token_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      expires_at TIMESTAMP NOT NULL,
      last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS guest_sessions_cafe_id_idx ON guest_sessions(cafe_id);
    CREATE INDEX IF NOT EXISTS guest_sessions_table_id_idx ON guest_sessions(table_id);
    CREATE INDEX IF NOT EXISTS guest_sessions_customer_id_idx ON guest_sessions(customer_id);
    CREATE UNIQUE INDEX IF NOT EXISTS guest_sessions_token_hash_idx ON guest_sessions(session_token_hash);
    CREATE INDEX IF NOT EXISTS guest_sessions_status_idx ON guest_sessions(status);
    CREATE INDEX IF NOT EXISTS guest_sessions_expires_at_idx ON guest_sessions(expires_at);

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id TEXT REFERENCES users(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS orders_guest_session_id_idx ON orders(guest_session_id);
    CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders(customer_id);
  `);
  console.log("Migration completed successfully!");

  const tableRes = await db.execute(sql`SELECT count(*) FROM guest_sessions`);
  const columnRes = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name IN ('guest_session_id', 'customer_id')
  `);
  console.log("Verified guest_sessions count:", tableRes);
  console.log("Verified orders columns:", columnRes);
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
