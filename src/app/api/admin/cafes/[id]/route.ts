import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/permissions/guards";
import { cafeAdminService } from "@/features/super-admin/services/cafe-admin.service";
import { updateCafeSchema } from "@/features/super-admin/schemas/cafe.schema";
import { formatErrorResponse } from "@/lib/errors/app-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const data = await cafeAdminService.getCafeById(id);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const errorResponse = formatErrorResponse(err);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin();
    const { id } = await params;

    const body = await req.json();
    const validated = updateCafeSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const data = await cafeAdminService.updateCafe(
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
