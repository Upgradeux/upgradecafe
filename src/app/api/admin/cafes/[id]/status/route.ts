import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/permissions/guards";
import { cafeAdminService } from "@/features/super-admin/services/cafe-admin.service";
import { updateCafeStatusSchema } from "@/features/super-admin/schemas/cafe.schema";
import { formatErrorResponse } from "@/lib/errors/app-error";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin();
    const { id } = await params;

    const body = await req.json();
    const validated = updateCafeStatusSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const data = await cafeAdminService.setCafeStatus(
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
