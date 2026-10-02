import { Cafe } from "@/lib/db/schema/cafes";
import { Subscription } from "@/lib/db/schema/subscriptions";

export type AccessStatus = "ACTIVE" | "GRACE" | "SUSPENDED" | "ARCHIVED";

export interface CafeAccessState {
  status: AccessStatus;
  isAccessible: boolean;           // Whether owner/staff/public can access
  isSuperAdminOnly: boolean;       // Whether only Super Admin has access
  reason: string;
  expiresAt: Date | null;
  graceEndsAt: Date | null;
  daysRemainingInPeriod: number;   // Days left in active subscription or grace period
  daysRemaining: number;           // Alias for daysRemainingInPeriod
  graceDaysRemaining: number;      // Days left in grace period
  hasManualOverride: boolean;
  manualOverrideStatus: string | null;
}

export type AccessState = CafeAccessState;

/**
 * Authoritative Server-Side Access State Resolver.
 * PostgreSQL is the single source of truth.
 * Evaluates subscriptions, grace periods, and manual Super Admin overrides.
 */
export function getCafeAccessState(
  cafe: Pick<Cafe, "status" | "manualStatusOverride" | "suspensionReason">,
  subscription?: Pick<Subscription, "startsAt" | "expiresAt" | "gracePeriodDays" | "status"> | null,
  now: Date = new Date()
): CafeAccessState {
  // 1. Soft Archive Check
  if (cafe.status === "ARCHIVED") {
    return {
      status: "ARCHIVED",
      isAccessible: false,
      isSuperAdminOnly: true,
      reason: "Café is archived",
      expiresAt: subscription?.expiresAt ?? null,
      graceEndsAt: null,
      daysRemainingInPeriod: 0,
      daysRemaining: 0,
      graceDaysRemaining: 0,
      hasManualOverride: false,
      manualOverrideStatus: null,
    };
  }

  // 2. Manual Status Override Check (Super Admin administrative force)
  if (cafe.manualStatusOverride === "SUSPENDED") {
    return {
      status: "SUSPENDED",
      isAccessible: false,
      isSuperAdminOnly: true,
      reason: cafe.suspensionReason || "Manually suspended by Super Admin",
      expiresAt: subscription?.expiresAt ?? null,
      graceEndsAt: null,
      daysRemainingInPeriod: 0,
      daysRemaining: 0,
      graceDaysRemaining: 0,
      hasManualOverride: true,
      manualOverrideStatus: "SUSPENDED",
    };
  }

  if (cafe.manualStatusOverride === "ACTIVE") {
    return {
      status: "ACTIVE",
      isAccessible: true,
      isSuperAdminOnly: false,
      reason: "Manually granted active access by Super Admin",
      expiresAt: subscription?.expiresAt ?? null,
      graceEndsAt: null,
      daysRemainingInPeriod: 999,
      daysRemaining: 999,
      graceDaysRemaining: 0,
      hasManualOverride: true,
      manualOverrideStatus: "ACTIVE",
    };
  }

  // 3. No Subscription Record
  if (!subscription) {
    return {
      status: "SUSPENDED",
      isAccessible: false,
      isSuperAdminOnly: true,
      reason: "No active subscription on record",
      expiresAt: null,
      graceEndsAt: null,
      daysRemainingInPeriod: 0,
      daysRemaining: 0,
      graceDaysRemaining: 0,
      hasManualOverride: false,
      manualOverrideStatus: null,
    };
  }

  const expiresAt = new Date(subscription.expiresAt);
  const gracePeriodMs = (subscription.gracePeriodDays ?? 7) * 24 * 60 * 60 * 1000;
  const graceEndsAt = new Date(expiresAt.getTime() + gracePeriodMs);

  const currentTime = now.getTime();
  const expiresTime = expiresAt.getTime();
  const graceEndsTime = graceEndsAt.getTime();

  // 4. Subscription is Active
  if (currentTime <= expiresTime) {
    const msRemaining = expiresTime - currentTime;
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    return {
      status: "ACTIVE",
      isAccessible: true,
      isSuperAdminOnly: false,
      reason: `Active subscription (${daysRemaining} days remaining)`,
      expiresAt,
      graceEndsAt,
      daysRemainingInPeriod: daysRemaining,
      daysRemaining,
      graceDaysRemaining: 0,
      hasManualOverride: false,
      manualOverrideStatus: null,
    };
  }

  // 5. Expiry passed, but within Grace Period (7 days default)
  if (currentTime <= graceEndsTime) {
    const msRemaining = graceEndsTime - currentTime;
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    return {
      status: "GRACE",
      isAccessible: true,
      isSuperAdminOnly: false,
      reason: `In grace period (${daysRemaining} days remaining before suspension)`,
      expiresAt,
      graceEndsAt,
      daysRemainingInPeriod: daysRemaining,
      daysRemaining: 0,
      graceDaysRemaining: daysRemaining,
      hasManualOverride: false,
      manualOverrideStatus: null,
    };
  }

  // 6. Expired past grace period -> Suspended
  return {
    status: "SUSPENDED",
    isAccessible: false,
    isSuperAdminOnly: true,
    reason: "Subscription expired and 7-day grace period elapsed",
    expiresAt,
    graceEndsAt,
    daysRemainingInPeriod: 0,
    daysRemaining: 0,
    graceDaysRemaining: 0,
    hasManualOverride: false,
    manualOverrideStatus: null,
  };
}
