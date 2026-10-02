import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/permissions/guards";
import { planAdminService } from "@/features/super-admin/services/plan-admin.service";
import { updatePlanSchema } from "@/features/super-admin/schemas/plan.schema";
import { formatErrorResponse } from "@/lib/errors/app-error";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin();
    const { id } = await params;

    const body = await req.json();
    const validated = updatePlanSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const data = await planAdminService.updatePlan(
      id,
      validated,
      user.id,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const errorResponse = formatErrorResponse(err);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
