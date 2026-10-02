import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { verifyPassword, hashPassword } from "better-auth/crypto";
import { db } from "@/lib/db";
import { accounts, sessions } from "@/lib/db/schema/auth-tables";
import { users } from "@/lib/db/schema/users";
import { requireAuth } from "@/lib/permissions/guards";
import { AppError, formatErrorResponse } from "@/lib/errors/app-error";
import { checkRateLimit } from "@/lib/rate-limit/rate-limiter";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12, "Use at least 12 characters for your new password.").max(128),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    await checkRateLimit("ADMIN_MUTATION", user.id);
    const input = changePasswordSchema.parse(await request.json());

    if (input.currentPassword === input.newPassword) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Choose a new password that differs from the temporary password.",
        statusCode: 400,
      });
    }

    const [credential] = await db
      .select({ id: accounts.id, password: accounts.password })
      .from(accounts)
      .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")))
      .limit(1);

    if (!credential?.password || !(await verifyPassword({ hash: credential.password, password: input.currentPassword }))) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "The current password is incorrect.",
        statusCode: 401,
      });
    }

    const passwordHash = await hashPassword(input.newPassword);
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(accounts)
        .set({ password: passwordHash, updatedAt: now })
        .where(eq(accounts.id, credential.id));

      await tx
        .update(users)
        .set({ mustChangePassword: false, updatedAt: now })
        .where(eq(users.id, user.id));

      await tx
        .delete(sessions)
        .where(and(eq(sessions.userId, user.id), ne(sessions.id, user.sessionId)));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const response = formatErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
