import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/permissions/guards";
import { activityAdminService } from "@/features/super-admin/services/activity-admin.service";
import { formatErrorResponse } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const cafeId = searchParams.get("cafeId") || undefined;

    const data = await activityAdminService.listActivityLogs({
      page,
      limit,
      cafeId,
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const errorResponse = formatErrorResponse(err);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
