import "dotenv/config";
import postgres from "postgres";

async function ensureMustChangePasswordColumn() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be configured before running database migrations.");
  }

  const sql = postgres(connectionString, { prepare: false, max: 1, connect_timeout: 10 });
  try {
    await sql`
      ALTER TABLE "public"."users"
      ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false NOT NULL
    `;

    const [column] = await sql<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'must_change_password'
    `;

    if (!column) {
      throw new Error('Migration did not create "public.users.must_change_password".');
    }

    console.info('Verified public.users.must_change_password is present.');
  } finally {
    await sql.end();
  }
}

ensureMustChangePasswordColumn().catch((error: unknown) => {
  console.error("Could not ensure the Super Admin password migration:", error);
  process.exitCode = 1;
});
