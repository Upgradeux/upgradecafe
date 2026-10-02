import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { TablesService } from "@/features/cafe/tables/services/tables.service";
import { AppError } from "@/lib/errors/app-error";
import { z } from "zod";

const updateFloorSchema = z.object({
  name: z.string().min(1, "Zone/Floor name is required").max(100).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; id: string }> }
) {
  try {
    const { cafeSlug, id } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);
    const body = await request.json();

    const validated = updateFloorSchema.parse(body);
    const updated = await TablesService.updateFloor(id, cafe.id, validated);

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

    await TablesService.deleteFloor(id, cafe.id);

    return NextResponse.json({ success: true, message: "Floor / dining zone deleted." });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
