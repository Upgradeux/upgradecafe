import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { MenuService } from "@/features/cafe/menu/services/menu.service";
import { AppError } from "@/lib/errors/app-error";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; id: string }> }
) {
  try {
    const { cafeSlug, id } = await params;
    // Both Owner and Staff (kitchen/waiter/cashier) should be able to 86/toggle availability!
    const { cafe } = await resolveCafeTenant(cafeSlug);

    const updated = await MenuService.toggleAvailability(id, cafe.id);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
