import "dotenv/config";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema/auth-tables";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";
import { verifyPassword } from "better-auth/crypto";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD before checking authentication.");
  }

  console.log(`Testing authentication for: ${email}`);

  // 1. Check user record
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    console.error(`❌ User record not found for ${email}`);
    process.exit(1);
  }

  console.log(`✓ User found: ID=${user.id}, Role=${user.role}`);

  // 2. Check account record
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, user.id))
    .limit(1);

  if (!account) {
    console.error(`❌ No credential account found for user ID ${user.id}`);
    process.exit(1);
  }

  console.log(`✓ Account found: Provider=${account.providerId}, AccountID=${account.accountId}`);

  // 3. Verify Account ID matching rule (Better Auth requirement)
  if (account.accountId !== user.id) {
    console.error(`❌ Better Auth Mismatch! account.accountId (${account.accountId}) must equal user.id (${user.id})`);
    process.exit(1);
  }
  console.log(`✓ Account ID matching rule verified (accountId === user.id).`);

  // 4. Verify password hash
  if (!account.password) {
    console.error(`❌ No password hash stored on account record.`);
    process.exit(1);
  }

  const isPasswordValid = await verifyPassword({
    hash: account.password,
    password,
  });

  if (!isPasswordValid) {
    console.error(`❌ Password verification failed! Hash does not match.`);
    process.exit(1);
  }

  console.log(`✓ Password hash verified successfully!`);
  console.log(`\nAuth test passed for ${email}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Auth test error:", err);
  process.exit(1);
});
