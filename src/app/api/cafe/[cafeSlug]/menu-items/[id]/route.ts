import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { MenuService } from "@/features/cafe/menu/services/menu.service";
import { menuItemSchema } from "@/features/cafe/menu/schemas/menu.schema";
import { AppError } from "@/lib/errors/app-error";
import { invalidateCafePublicMenu } from "@/features/cafe/public-menu/services/public-menu-cache.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; id: string }> }
) {
  try {
    const { cafeSlug, id } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);
    const body = await request.json();

    const validated = menuItemSchema.partial().parse(body);
    const updated = await MenuService.updateMenuItem(id, cafe.id, validated);
    invalidateCafePublicMenu(cafeSlug);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return AppError.toResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; id: string }> }
) {
  try {
    const { cafeSlug, id } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);

    await MenuService.deleteMenuItem(id, cafe.id);
    invalidateCafePublicMenu(cafeSlug);

    return NextResponse.json({ success: true, message: "Menu item deleted." });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
