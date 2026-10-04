import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { cafeMemberships } from "@/lib/db/schema/memberships";
import { cafes } from "@/lib/db/schema/cafes";
import { subscriptions } from "@/lib/db/schema/subscriptions";
import { tables, Table } from "@/lib/db/schema/tables";
import { orders } from "@/lib/db/schema/orders";
import { guestSessions, GuestSession } from "@/lib/db/schema/guest-sessions";
import { eq, and, gt } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import { getCafeAccessState } from "@/server/services/access-state.service";
import { users } from "@/lib/db/schema/users";
import {
  getSessionCookieName,
  hashSessionToken,
} from "@/features/cafe/orders/services/guest-session.service";

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

/**
 * Resolves active guest session for a cafe by inspecting secure HTTP-only cookies or header token.
 * Returns null if no valid, unexpired session exists for this tenant.
 */
export async function resolveGuestSession(
  req: NextRequest,
  cafeSlug: string,
  cafeId: string
): Promise<GuestSession | null> {
  const cookieName = getSessionCookieName(cafeSlug);
  const rawToken = req.cookies.get(cookieName)?.value;

  if (!rawToken || !rawToken.trim()) return null;

  const tokenHash = hashSessionToken(rawToken.trim());
  const [session] = await db
    .select()
    .from(guestSessions)
    .where(
      and(
        eq(guestSessions.cafeId, cafeId),
        eq(guestSessions.sessionTokenHash, tokenHash),
        eq(guestSessions.status, "ACTIVE"),
        gt(guestSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  return session || null;
}

/**
 * Enforces that the request has an active, valid guest session for the specified cafe.
 */
export async function requireGuestSession(
  req: NextRequest,
  cafeSlug: string,
  cafeId: string
): Promise<GuestSession> {
  const session = await resolveGuestSession(req, cafeSlug, cafeId);
  if (!session) {
    throw new AppError({
      code: "UNAUTHORIZED",
      message: "A valid guest session is required to access this resource.",
      statusCode: 401,
    });
  }
  return session;
}

/**
 * Validates that an order belongs to the specified café and the caller is authorized to view or mutate it.
 * Authorized callers:
 * 1. Super Admin
 * 2. Authenticated café staff/owner
 * 3. Verified guest holding the matching guest session
 * 4. Verified customer matching order.customerId
 * 
 * If caller is not authorized, throws 404 ORDER_NOT_FOUND to prevent ID enumeration.
 */
export async function requireOrderAccess(
  req: NextRequest,
  cafeSlug: string,
  cafeId: string,
  orderId: string
): Promise<{ order: typeof orders.$inferSelect; accessType: "STAFF" | "ADMIN" | "GUEST" | "CUSTOMER" }> {
  // 1. Fetch order strictly scoped to this cafe tenant
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.cafeId, cafeId)))
    .limit(1);

  if (!order) {
    throw new AppError({
      code: "ORDER_NOT_FOUND",
      message: "Order not found.",
      statusCode: 404,
    });
  }

  // 2. Check if caller is authenticated staff/owner or Super Admin
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (session?.user) {
      if (session.user.role === "SUPER_ADMIN") {
        return { order, accessType: "ADMIN" };
      }
      const [membership] = await db
        .select()
        .from(cafeMemberships)
        .where(
          and(
            eq(cafeMemberships.userId, session.user.id),
            eq(cafeMemberships.cafeId, cafeId),
            eq(cafeMemberships.isActive, true)
          )
        )
        .limit(1);
      if (membership) {
        return { order, accessType: "STAFF" };
      }
      if (order.customerId && order.customerId === session.user.id) {
        return { order, accessType: "CUSTOMER" };
      }
    }
  } catch {}

  // 3. Check guest session token from cookies / headers
  const guestSession = await resolveGuestSession(req, cafeSlug, cafeId);
  if (guestSession) {
    if (order.guestSessionId && order.guestSessionId === guestSession.id) {
      return { order, accessType: "GUEST" };
    }
    if (order.customerId && guestSession.customerId === order.customerId) {
      return { order, accessType: "GUEST" };
    }
  }

  // 4. Deny access with 404 to avoid leaking whether another user's order exists
  throw new AppError({
    code: "ORDER_NOT_FOUND",
    message: "Order not found.",
    statusCode: 404,
  });
}

/**
 * Validates that a table belongs to the specified café tenant.
 */
export async function requireTableBelongsToCafe(
  tableId: string,
  cafeId: string
): Promise<Table> {
  const [table] = await db
    .select()
    .from(tables)
    .where(and(eq(tables.id, tableId), eq(tables.cafeId, cafeId)))
    .limit(1);

  if (!table) {
    throw new AppError({
      code: "TABLE_NOT_FOUND",
      message: "Table not found in this café.",
      statusCode: 404,
    });
  }

  return table;
}
