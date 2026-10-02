import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/permissions/guards";
import { checkRateLimit } from "@/lib/rate-limit/rate-limiter";
import { paymentAdminService } from "@/features/super-admin/services/payment-admin.service";
import { recordPaymentSchema } from "@/features/super-admin/schemas/payment.schema";
import { formatErrorResponse } from "@/lib/errors/app-error";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const cafeId = searchParams.get("cafeId") || undefined;
    const paymentMethod = searchParams.get("paymentMethod") || undefined;

    const data = await paymentAdminService.listPayments({
      page,
      limit,
      cafeId,
      paymentMethod,
    });

    const totals = await paymentAdminService.getPaymentTotals();

    return NextResponse.json({ success: true, data, totals });
  } catch (err) {
    const errorResponse = formatErrorResponse(err);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSuperAdmin();

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await checkRateLimit("ADMIN_MUTATION", ip);

    const body = await req.json();
    const validated = recordPaymentSchema.parse(body);

    const userAgent = req.headers.get("user-agent") || undefined;

    const data = await paymentAdminService.recordOfflinePayment(
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
