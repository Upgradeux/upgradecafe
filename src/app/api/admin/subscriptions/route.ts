import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/permissions/guards";
import { subscriptionAdminService } from "@/features/super-admin/services/subscription-admin.service";
import { formatErrorResponse } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const status = searchParams.get("status") || undefined;

    const data = await subscriptionAdminService.listSubscriptions({
      page,
      limit,
      status,
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const errorResponse = formatErrorResponse(err);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
