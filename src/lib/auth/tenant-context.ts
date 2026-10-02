import { db } from "@/lib/db";
import { cafes, Cafe } from "@/lib/db/schema/cafes";
import { subscriptions, Subscription } from "@/lib/db/schema/subscriptions";
import { cafeSettings, CafeSetting } from "@/lib/db/schema/cafe-settings";
import { eq } from "drizzle-orm";
import { requireCafeMember, AuthenticatedUser } from "@/lib/permissions/guards";
import { getCafeAccessState, AccessState } from "@/server/services/access-state.service";
import { AppError } from "@/lib/errors/app-error";

export interface CafeTenantContext {
  cafe: Cafe;
  user: AuthenticatedUser;
  membershipRole: string;
  isSuperAdmin: boolean;
  accessState: AccessState;
  settings?: CafeSetting | null;
}

/**
 * Server-side helper to resolve tenant by slug, verify access lifecycle state,
 * enforce tenant membership IDOR guard, and return full context.
 */
export async function resolveCafeTenant(
  cafeSlug: string,
  allowedRoles?: Array<"OWNER" | "STAFF" | "MANAGER" | "CASHIER" | "KITCHEN" | "WAITER">
): Promise<CafeTenantContext> {
  const [cafe] = await db
    .select()
    .from(cafes)
    .where(eq(cafes.slug, cafeSlug))
    .limit(1);

  if (!cafe) {
    throw new AppError({
      code: "CAFE_NOT_FOUND",
      message: `Café '${cafeSlug}' not found.`,
      statusCode: 404,
    });
  }

  // Enforce tenant authorization guard (handles session, membership, and access status)
  const authResult = await requireCafeMember(cafe.id, allowedRoles);

  // Fetch subscription for access state calculations
  const [activeSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.cafeId, cafe.id))
    .limit(1);

  const accessState = getCafeAccessState(cafe, (activeSub || null) as Subscription | null);

  // Fetch tenant settings
  const [settings] = await db
    .select()
    .from(cafeSettings)
    .where(eq(cafeSettings.cafeId, cafe.id))
    .limit(1);

  return {
    cafe,
    user: authResult.user,
    membershipRole: authResult.membershipRole,
    isSuperAdmin: authResult.isSuperAdmin,
    accessState,
    settings: settings || null,
  };
}
