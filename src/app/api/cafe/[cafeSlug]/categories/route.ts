import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { MenuService } from "@/features/cafe/menu/services/menu.service";
import { categorySchema } from "@/features/cafe/menu/schemas/menu.schema";
import { AppError } from "@/lib/errors/app-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug);
    const categories = await MenuService.listCategories(cafe.id);

    return NextResponse.json({ success: true, data: categories });
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

    const validated = categorySchema.parse(body);
    const category = await MenuService.createCategory(cafe.id, validated);

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
