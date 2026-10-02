import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { TablesService } from "@/features/cafe/tables/services/tables.service";
import { tableSchema } from "@/features/cafe/tables/schemas/table.schema";
import { AppError } from "@/lib/errors/app-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; id: string }> }
) {
  try {
    const { cafeSlug, id } = await params;
    // Both Owner, Manager, and Staff can update table status
    const { cafe } = await resolveCafeTenant(cafeSlug);
    const body = await request.json();

    const validated = tableSchema.partial().parse(body);
    const updated = await TablesService.updateTable(id, cafe.id, validated);

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

    await TablesService.deleteTable(id, cafe.id);

    return NextResponse.json({ success: true, message: "Table deleted." });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
