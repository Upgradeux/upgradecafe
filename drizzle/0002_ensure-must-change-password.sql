-- Repair installations where the migration ledger already contains the original
-- migration but the column is absent from the users table.
ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false NOT NULL;
