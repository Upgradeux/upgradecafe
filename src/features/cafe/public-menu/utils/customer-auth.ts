import { CustomerProfile } from "../types";

const ACCOUNTS_REGISTRY_KEY = "cafe_customer_accounts_v1";
const RATE_LIMIT_PREFIX = "cafe_otp_limit_";

export interface RateLimitStatus {
  allowed: boolean;
  cooldownSeconds: number;
  attemptsLeft: number;
}

/**
 * Normalizes phone numbers to standard format (strip spaces, dashes, parentheses).
 */
export function normalizePhone(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

/**
 * Validates phone numbers (must be between 10 and 15 digits).
 */
export function isValidPhone(rawPhone: string): boolean {
  const cleaned = rawPhone.replace(/[\s\-\(\)\+]/g, "");
  return /^[0-9]{10,15}$/.test(cleaned);
}

/**
 * Checks rate limiting for sending OTP to prevent abuse.
 * Max 4 attempts per 10 minutes, with a 30s cooldown between attempts.
 */
export function checkOtpRateLimit(phone: string): RateLimitStatus {
  if (typeof window === "undefined") {
    return { allowed: true, cooldownSeconds: 0, attemptsLeft: 4 };
  }

  const key = `${RATE_LIMIT_PREFIX}${normalizePhone(phone)}`;
  const now = Date.now();
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return { allowed: true, cooldownSeconds: 0, attemptsLeft: 4 };
    }

    const data: { count: number; firstAttempt: number; lastAttempt: number } = JSON.parse(raw);
    const windowMs = 10 * 60 * 1000; // 10 minutes window
    const cooldownMs = 30 * 1000; // 30 seconds cooldown

    if (now - data.firstAttempt > windowMs) {
      // Window expired, reset
      sessionStorage.removeItem(key);
      return { allowed: true, cooldownSeconds: 0, attemptsLeft: 4 };
    }

    const elapsedSinceLast = now - data.lastAttempt;
    if (elapsedSinceLast < cooldownMs) {
      const remainingSecs = Math.ceil((cooldownMs - elapsedSinceLast) / 1000);
      return {
        allowed: false,
        cooldownSeconds: remainingSecs,
        attemptsLeft: Math.max(0, 4 - data.count),
      };
    }

    if (data.count >= 4) {
      const windowRemainingSecs = Math.ceil((windowMs - (now - data.firstAttempt)) / 1000);
      return {
        allowed: false,
        cooldownSeconds: windowRemainingSecs,
        attemptsLeft: 0,
      };
    }

    return {
      allowed: true,
      cooldownSeconds: 0,
      attemptsLeft: 4 - data.count,
    };
  } catch {
    return { allowed: true, cooldownSeconds: 0, attemptsLeft: 4 };
  }
}

/**
 * Records an OTP request attempt for rate limiting.
 */
export function recordOtpAttempt(phone: string): void {
  if (typeof window === "undefined") return;
  const key = `${RATE_LIMIT_PREFIX}${normalizePhone(phone)}`;
  const now = Date.now();
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      sessionStorage.setItem(key, JSON.stringify({ count: 1, firstAttempt: now, lastAttempt: now }));
    } else {
      const data = JSON.parse(raw);
      sessionStorage.setItem(
        key,
        JSON.stringify({
          count: data.count + 1,
          firstAttempt: data.firstAttempt,
          lastAttempt: now,
        })
      );
    }
  } catch {}
}

/**
 * Master Registry: Retrieve all stored customer accounts.
 */
export function getRegisteredAccounts(): Record<string, CustomerProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Lookup an existing customer profile by phone or email.
 */
export function findRegisteredProfile(identifier: string): CustomerProfile | null {
  if (!identifier) return null;
  const accounts = getRegisteredAccounts();
  const trimmed = identifier.trim().toLowerCase();
  const isEmail = trimmed.includes("@");
  const normalizedPhone = !isEmail ? normalizePhone(identifier).toLowerCase() : "";

  // Check direct key match
  if (isEmail && accounts[trimmed]) {
    return accounts[trimmed];
  }
  if (!isEmail && accounts[normalizedPhone]) {
    return accounts[normalizedPhone];
  }

  // Check across all accounts by phone or email field
  for (const acc of Object.values(accounts)) {
    if (isEmail) {
      if (acc.email && acc.email.trim().toLowerCase() === trimmed) {
        return acc;
      }
    } else {
      if (acc.phone && normalizePhone(acc.phone).toLowerCase() === normalizedPhone) {
        return acc;
      }
    }
  }

  return null;
}

/**
 * Save or update a customer profile in the master account registry.
 * Indexes by phone, email, and ID so any login method restores the same profile!
 */
export function saveToAccountsRegistry(profile: CustomerProfile): void {
  if (typeof window === "undefined" || !profile) return;
  try {
    const accounts = getRegisteredAccounts();
    const updated = {
      ...profile,
      isGuest: false,
    };

    if (profile.phone) {
      const phoneKey = normalizePhone(profile.phone).toLowerCase();
      accounts[phoneKey] = updated;
    }
    if (profile.email) {
      const emailKey = profile.email.trim().toLowerCase();
      accounts[emailKey] = updated;
    }
    if (profile.id) {
      accounts[profile.id] = updated;
    }

    localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
  } catch {}
}

/**
 * Get active customer profile for a specific cafe.
 */
export function getActiveCustomerProfile(cafeSlug: string): CustomerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`cafe_customer_profile_${cafeSlug}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

/**
 * Set active customer profile for a cafe (and sync to master accounts registry).
 */
export function setActiveCustomerProfile(cafeSlug: string, profile: CustomerProfile | null): void {
  if (typeof window === "undefined") return;
  try {
    if (profile && !profile.isGuest) {
      localStorage.setItem(`cafe_customer_profile_${cafeSlug}`, JSON.stringify(profile));
      saveToAccountsRegistry(profile);
    } else {
      localStorage.removeItem(`cafe_customer_profile_${cafeSlug}`);
    }
  } catch {}
}

/**
 * Generate a 6-digit verification code.
 */
export function generateOtpCode(): string {
  // Deterministic 6-digit OTP code for reliable verification
  return Math.floor(100000 + Math.random() * 900000).toString();
}
