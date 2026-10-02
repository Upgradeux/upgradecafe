import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/permissions/guards";
import { planAdminService } from "@/features/super-admin/services/plan-admin.service";
import { createPlanSchema } from "@/features/super-admin/schemas/plan.schema";
import { formatErrorResponse } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const data = await planAdminService.listPlans(req.nextUrl.searchParams.get("activeOnly") === "true");
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const errorResponse = formatErrorResponse(err);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSuperAdmin();
    const body = await req.json();
    const validated = createPlanSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const data = await planAdminService.createPlan(
      validated,
      user.id,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    const errorResponse = formatErrorResponse(err);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
