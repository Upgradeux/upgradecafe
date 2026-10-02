import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { TablesService } from "@/features/cafe/tables/services/tables.service";
import { tableSchema } from "@/features/cafe/tables/schemas/table.schema";
import { AppError } from "@/lib/errors/app-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug);
    const tables = await TablesService.listTables(cafe.id);

    return NextResponse.json({ success: true, data: tables });
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

    const validated = tableSchema.parse(body);
    const table = await TablesService.createTable(cafe.id, validated);

    return NextResponse.json({ success: true, data: table }, { status: 201 });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
