import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/permissions/guards";
import { checkRateLimit } from "@/lib/rate-limit/rate-limiter";
import { cafeAdminService } from "@/features/super-admin/services/cafe-admin.service";
import { createCafeSchema } from "@/features/super-admin/schemas/cafe.schema";
import { formatErrorResponse } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const data = await cafeAdminService.listCafes({
      page,
      limit,
      search,
      status,
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const errorResponse = formatErrorResponse(err);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSuperAdmin();

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await checkRateLimit("CAFE_CREATION", ip);

    const body = await req.json();
    const validated = createCafeSchema.parse(body);

    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await cafeAdminService.createCafeTransactional(
      validated,
      user.id,
      ip,
      userAgent
    );

    return NextResponse.json(
      { success: true, data: result },
      { status: 201, headers: { "Cache-Control": "no-store, private" } }
    );
  } catch (err) {
    const errorResponse = formatErrorResponse(err);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
