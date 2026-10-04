import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { verifications } from "@/lib/db/schema/auth-tables";

const OTP_TTL_SECONDS = 300;
const OTP_MAX_ATTEMPTS = 3;
const OTP_SECRET =
  process.env.BETTER_AUTH_SECRET || "local-only-upgradecafe-otp-secret-change-before-production";

type VerifyOtpResult = {
  success: boolean;
  error?: "EXPIRED" | "INVALID" | "LOCKED" | "NOT_FOUND";
  message: string;
};

export function generateSecureOtp(): string {
  return randomInt(100000, 1000000).toString();
}

export function normalizeOtpTarget(target: string): string {
  const cleanTarget = target.trim();
  if (cleanTarget.includes("@")) return cleanTarget.toLowerCase();
  const digits = cleanTarget.replace(/\D/g, "");
  return `91${digits.length > 10 ? digits.slice(-10) : digits}`;
}

function getVerificationId(target: string): string {
  const digest = createHmac("sha256", OTP_SECRET).update(normalizeOtpTarget(target)).digest("hex");
  return `customer-otp:${digest}`;
}

function hashCode(code: string): string {
  return createHmac("sha256", OTP_SECRET).update(code).digest("hex");
}

export async function storeOtp(
  target: string,
  code: string,
  ttlSeconds = OTP_TTL_SECONDS
): Promise<{ expiresAt: Date }> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  const id = getVerificationId(target);
  const value = JSON.stringify({ codeHash: hashCode(code), attemptsLeft: OTP_MAX_ATTEMPTS });

  await db
    .insert(verifications)
    .values({ id, identifier: id, value, expiresAt, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: verifications.id,
      set: { identifier: id, value, expiresAt, updatedAt: now },
    });

  return { expiresAt };
}

export async function removeOtp(target: string): Promise<void> {
  await db.delete(verifications).where(eq(verifications.id, getVerificationId(target)));
}

export async function verifyOtp(target: string, submittedCode: string): Promise<VerifyOtpResult> {
  const id = getVerificationId(target);
  return db.transaction(async (tx) => {
    const [entry] = await tx
      .select()
      .from(verifications)
      .where(eq(verifications.id, id))
      .for("update")
      .limit(1);

    if (!entry) {
      return {
        success: false,
        error: "NOT_FOUND",
        message: "No active verification code found. Please request a new code.",
      };
    }

    if (entry.expiresAt.getTime() <= Date.now()) {
      await tx.delete(verifications).where(eq(verifications.id, id));
      return {
        success: false,
        error: "EXPIRED",
        message: "Verification code has expired. Please request a new code.",
      };
    }

    let stored: { codeHash?: string; attemptsLeft?: number };
    try {
      stored = JSON.parse(entry.value);
    } catch {
      await tx.delete(verifications).where(eq(verifications.id, id));
      return {
        success: false,
        error: "NOT_FOUND",
        message: "No active verification code found. Please request a new code.",
      };
    }

    const expectedHash = stored.codeHash;
    const receivedHash = hashCode(submittedCode.trim());
    const isValid =
      typeof expectedHash === "string" &&
      /^[a-f0-9]{64}$/.test(expectedHash) &&
      timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(receivedHash, "hex"));

    if (!isValid) {
      const attemptsLeft = Math.max(0, (stored.attemptsLeft ?? 1) - 1);
      if (attemptsLeft === 0) {
        await tx.delete(verifications).where(eq(verifications.id, id));
        return {
          success: false,
          error: "LOCKED",
          message: "Maximum verification attempts exceeded. Please request a new code.",
        };
      }

      await tx
        .update(verifications)
        .set({ value: JSON.stringify({ ...stored, attemptsLeft }), updatedAt: new Date() })
        .where(eq(verifications.id, id));
      return {
        success: false,
        error: "INVALID",
        message: `Incorrect code. ${attemptsLeft} attempt(s) remaining.`,
      };
    }

    await tx.delete(verifications).where(eq(verifications.id, id));
    return { success: true, message: "Code verified successfully." };
  });
}
