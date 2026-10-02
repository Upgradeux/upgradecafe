import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { cafeMemberships } from "@/lib/db/schema/memberships";
import { cafes } from "@/lib/db/schema/cafes";
import { subscriptions } from "@/lib/db/schema/subscriptions";
import { eq, and } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import { getCafeAccessState } from "@/server/services/access-state.service";
import { users } from "@/lib/db/schema/users";

export interface AuthenticatedUser {
  id: string;
  sessionId: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  mustChangePassword: boolean;
}

/**
 * Ensures request has a valid active session.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || !session.user) {
    throw new AppError({
      code: "UNAUTHORIZED",
      message: "Authentication required to access this resource.",
      statusCode: 401,
    });
  }

  const [account] = await db
    .select({ role: users.role, mustChangePassword: users.mustChangePassword })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!account) {
    throw new AppError({
      code: "UNAUTHORIZED",
      message: "The signed-in account is no longer available.",
      statusCode: 401,
    });
  }

  return {
    id: session.user.id,
    sessionId: session.session.id,
    name: session.user.name,
    email: session.user.email,
    role: account.role || "USER",
    image: session.user.image,
    mustChangePassword: account.mustChangePassword,
  };
}

/**
 * Ensures user is authenticated and has the platform SUPER_ADMIN role.
 * Café users and unauthenticated requests are strictly rejected.
 */
export async function requireSuperAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (user.role !== "SUPER_ADMIN") {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Access denied. Platform Super Admin privileges required.",
      statusCode: 403,
    });
  }

  return user;
}

/**
 * IDOR Protection & Multi-Tenant Authorization Guard.
 * Enforces that the user belongs to the requested cafe tenant.
 * Super Admin bypasses tenant isolation for administration purposes.
 */
export async function requireCafeMember(
  cafeId: string,
  allowedRoles?: Array<"OWNER" | "STAFF" | "MANAGER" | "CASHIER" | "KITCHEN" | "WAITER">
): Promise<{ user: AuthenticatedUser; membershipRole: string; isSuperAdmin: boolean }> {
  const user = await requireAuth();

  // Super Admin can access any cafe
  if (user.role === "SUPER_ADMIN") {
    return {
      user,
      membershipRole: "SUPER_ADMIN",
      isSuperAdmin: true,
    };
  }

  if (user.mustChangePassword) {
    throw new AppError({
      code: "PASSWORD_CHANGE_REQUIRED",
      message: "Change your temporary password before using café features.",
      statusCode: 403,
    });
  }

  // 1. Check tenant membership in PostgreSQL
  const [membership] = await db
    .select()
    .from(cafeMemberships)
    .where(
      and(
        eq(cafeMemberships.userId, user.id),
        eq(cafeMemberships.cafeId, cafeId),
        eq(cafeMemberships.isActive, true)
      )
    )
    .limit(1);

  if (!membership) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this café tenant.",
      statusCode: 403,
    });
  }

  // 2. Check role requirements if specified
  if (allowedRoles && !allowedRoles.includes(membership.role as any)) {
    throw new AppError({
      code: "FORBIDDEN",
      message: `Role '${membership.role}' is not authorized for this operation.`,
      statusCode: 403,
    });
  }

  // 3. Check Café Status & Access State
  const [cafe] = await db
    .select()
    .from(cafes)
    .where(eq(cafes.id, cafeId))
    .limit(1);

  if (!cafe) {
    throw new AppError({
      code: "CAFE_NOT_FOUND",
      message: "Café tenant not found.",
      statusCode: 404,
    });
  }

  const [activeSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.cafeId, cafeId))
    .limit(1);

  const accessState = getCafeAccessState(cafe, activeSub);

  if (accessState.status === "ARCHIVED") {
    throw new AppError({
      code: "CAFE_ARCHIVED",
      message: "This café tenant has been archived and cannot be accessed.",
      statusCode: 403,
    });
  }

  if (accessState.status === "SUSPENDED") {
    throw new AppError({
      code: "CAFE_SUSPENDED",
      message: `Café access is suspended: ${accessState.reason}. Please contact platform support.`,
      statusCode: 403,
    });
  }

  return {
    user,
    membershipRole: membership.role,
    isSuperAdmin: false,
  };
}

/**
 * Ensures user is the OWNER of the specified cafe tenant.
 */
export async function requireCafeOwner(cafeId: string): Promise<AuthenticatedUser> {
  const { user } = await requireCafeMember(cafeId, ["OWNER"]);
  return user;
}
