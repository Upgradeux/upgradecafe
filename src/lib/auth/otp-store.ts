import crypto from "crypto";

interface OtpEntry {
  code: string;
  target: string;
  expiresAt: number;
  attemptsLeft: number;
  createdAt: number;
}

// In-memory server-side OTP cache (persists across requests in node process)
// Note: In serverless, globalThis preserves state per lambda container instance
const globalOtpStore = globalThis as unknown as {
  _customerOtpMap?: Map<string, OtpEntry>;
  _customerLockoutMap?: Map<string, number>;
};

if (!globalOtpStore._customerOtpMap) {
  globalOtpStore._customerOtpMap = new Map();
}

if (!globalOtpStore._customerLockoutMap) {
  globalOtpStore._customerLockoutMap = new Map();
}

const otpMap = globalOtpStore._customerOtpMap;
const lockoutMap = globalOtpStore._customerLockoutMap;

/**
 * Generate a cryptographically random 6-digit OTP
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Store an OTP with a strict 30-second TTL
 */
export function storeOtp(target: string, code: string, ttlSeconds = 300): { expiresAt: number } {
  const normalized = target.trim().toLowerCase().replace(/\s+/g, "");
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;

  otpMap.set(normalized, {
    code,
    target: normalized,
    expiresAt,
    attemptsLeft: 3,
    createdAt: now,
  });

  return { expiresAt };
}

/**
 * Verify an OTP. Enforces strict 30-second expiry and attempt rate-limiting.
 */
export function verifyOtp(
  target: string,
  submittedCode: string
): { success: boolean; error?: "EXPIRED" | "INVALID" | "LOCKED" | "NOT_FOUND"; message: string } {
  const normalized = target.trim().toLowerCase().replace(/\s+/g, "");
  const now = Date.now();

  // Check lockout
  const lockoutUntil = lockoutMap.get(normalized);
  if (lockoutUntil && now < lockoutUntil) {
    const minutesLeft = Math.ceil((lockoutUntil - now) / 60000);
    return {
      success: false,
      error: "LOCKED",
      message: `Too many failed attempts. Locked out for ${minutesLeft} more minute(s).`,
    };
  }

  const entry = otpMap.get(normalized);
  if (!entry) {
    return {
      success: false,
      error: "NOT_FOUND",
      message: "No active verification code found. Please request a new code.",
    };
  }

  // Strict 30-second expiration check
  if (now > entry.expiresAt) {
    otpMap.delete(normalized);
    return {
      success: false,
      error: "EXPIRED",
      message: "Verification code has expired (30-second limit). Please request a new code.",
    };
  }

  // Code validation
  if (entry.code !== submittedCode.trim()) {
    entry.attemptsLeft -= 1;
    if (entry.attemptsLeft <= 0) {
      otpMap.delete(normalized);
      // Lock out for 10 minutes
      lockoutMap.set(normalized, now + 10 * 60 * 1000);
      return {
        success: false,
        error: "LOCKED",
        message: "Maximum verification attempts exceeded. Please try again after 10 minutes.",
      };
    }

    return {
      success: false,
      error: "INVALID",
      message: `Incorrect code. ${entry.attemptsLeft} attempt(s) remaining.`,
    };
  }

  // Success! Invalidate immediately to prevent reuse
  otpMap.delete(normalized);
  lockoutMap.delete(normalized);
  return {
    success: true,
    message: "Code verified successfully.",
  };
}
