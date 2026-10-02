import "dotenv/config";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "../index";
import { accounts } from "../schema/auth-tables";
import { users } from "../schema/users";

async function runSeed() {
  const configuredEmail = process.env.SUPER_ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL;
  const adminEmail = configuredEmail?.trim().toLowerCase();
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD before running db:seed.");
  }
  if (adminPassword.length < 12) {
    throw new Error("SUPER_ADMIN_PASSWORD must be at least 12 characters.");
  }

  try {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    const adminId = existingUser?.id ?? randomUUID();
    if (existingUser) {
      await db
        .update(users)
        .set({ role: "SUPER_ADMIN", emailVerified: true, mustChangePassword: false, updatedAt: new Date() })
        .where(eq(users.id, adminId));
    } else {
      await db.insert(users).values({
        id: adminId,
        name: "Super Administrator",
        email: adminEmail,
        emailVerified: true,
        role: "SUPER_ADMIN",
      });
    }

    const [credentialAccount] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.userId, adminId), eq(accounts.providerId, "credential")))
      .limit(1);

    if (!credentialAccount) {
      await db.insert(accounts).values({
        id: randomUUID(),
        userId: adminId,
        accountId: adminId,
        providerId: "credential",
        password: await hashPassword(adminPassword),
      });
    }

    console.log(`Super Admin account is ready for ${adminEmail}.`);
    console.log("No sample cafés, payments, or plans were created. Add your real plans in the admin portal.");
  } catch (error) {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  } finally {
    await db.$client.end();
  }
}

void runSeed();
