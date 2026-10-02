import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { TablesService } from "@/features/cafe/tables/services/tables.service";
import { AppError } from "@/lib/errors/app-error";
import { z } from "zod";

const createFloorSchema = z.object({
  name: z.string().min(1, "Zone/Floor name is required").max(100),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug);
    const floors = await TablesService.listFloors(cafe.id);

    return NextResponse.json({ success: true, data: floors });
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

    const validated = createFloorSchema.parse(body);
    const floor = await TablesService.createFloor(cafe.id, validated);

    return NextResponse.json({ success: true, data: floor }, { status: 201 });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
