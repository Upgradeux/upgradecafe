import "dotenv/config";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema/auth-tables";
import { users } from "@/lib/db/schema/users";

async function main() {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD before creating the Super Admin.");
  }
  if (adminPassword.length < 12) {
    throw new Error("SUPER_ADMIN_PASSWORD must be at least 12 characters.");
  }

  const [existingUser] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  const userId = existingUser?.id ?? randomUUID();

  if (existingUser) {
    await db.update(users).set({
      role: "SUPER_ADMIN",
      emailVerified: true,
      mustChangePassword: false,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  } else {
    await db.insert(users).values({
      id: userId,
      name: "Super Administrator",
      email: adminEmail,
      emailVerified: true,
      role: "SUPER_ADMIN",
    });
  }

  const [credentialAccount] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
    .limit(1);
  const password = await hashPassword(adminPassword);

  if (credentialAccount) {
    await db.update(accounts).set({ password, updatedAt: new Date() }).where(eq(accounts.id, credentialAccount.id));
  } else {
    await db.insert(accounts).values({
      id: randomUUID(),
      userId,
      accountId: userId,
      providerId: "credential",
      password,
    });
  }

  console.log(`Super Admin credentials are configured for ${adminEmail}.`);
}

main()
  .catch((error) => {
    console.error("Failed to create Super Admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
