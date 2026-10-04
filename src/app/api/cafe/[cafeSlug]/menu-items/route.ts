import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { MenuService } from "@/features/cafe/menu/services/menu.service";
import { menuItemSchema } from "@/features/cafe/menu/schemas/menu.schema";
import { AppError } from "@/lib/errors/app-error";
import { invalidateCafePublicMenu } from "@/features/cafe/public-menu/services/public-menu-cache.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug);

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId") || undefined;
    const search = searchParams.get("search") || undefined;
    const isAvailableParam = searchParams.get("isAvailable");
    const isAvailable = isAvailableParam !== null ? isAvailableParam === "true" : undefined;

    const items = await MenuService.listMenuItems(cafe.id, {
      categoryId,
      search,
      isAvailable,
    });

    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    return AppError.toResponse(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);
    const body = await request.json();

    const validated = menuItemSchema.parse(body);
    const item = await MenuService.createMenuItem(cafe.id, validated);
    invalidateCafePublicMenu(cafeSlug);

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
