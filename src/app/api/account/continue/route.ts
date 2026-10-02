import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cafeMemberships } from "@/lib/db/schema/memberships";
import { cafes } from "@/lib/db/schema/cafes";
import { requireAuth } from "@/lib/permissions/guards";
import { formatErrorResponse } from "@/lib/errors/app-error";

export async function GET() {
  try {
    const user = await requireAuth();

    if (user.mustChangePassword) {
      return NextResponse.json({ success: true, redirectTo: "/account/change-password" });
    }

    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json({ success: true, redirectTo: "/admin" });
    }

    const memberships = await db
      .select({ slug: cafes.slug })
      .from(cafeMemberships)
      .innerJoin(cafes, eq(cafeMemberships.cafeId, cafes.id))
      .where(and(eq(cafeMemberships.userId, user.id), eq(cafeMemberships.isActive, true)));

    const redirectTo = memberships.length === 1
      ? `/cafe/${memberships[0].slug}`
      : "/cafe/select";

    return NextResponse.json({ success: true, redirectTo });
  } catch (error) {
    const response = formatErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
