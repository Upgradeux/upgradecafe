import { NextResponse } from "next/server";
import { cafeAdminService } from "@/features/super-admin/services/cafe-admin.service";
import { activityAdminService } from "@/features/super-admin/services/activity-admin.service";
import { paymentAdminService } from "@/features/super-admin/services/payment-admin.service";
import { requireSuperAdmin } from "@/lib/permissions/guards";
import { formatErrorResponse } from "@/lib/errors/app-error";

export async function GET() {
  try {
    await requireSuperAdmin();

    const [cafes, activity, payments] = await Promise.all([
      cafeAdminService.getDashboardSummary(),
      activityAdminService.listActivityLogs({ limit: 6 }),
      paymentAdminService.getPaymentTotals(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...cafes,
        activity: activity.logs,
        totalRevenue: payments.totalRevenue,
      },
    });
  } catch (error) {
    const response = formatErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
