import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { ModifiersService } from "@/features/cafe/menu/services/modifiers.service";
import { AppError } from "@/lib/errors/app-error";
import { z } from "zod";

const createModifierGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(250).optional(),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]).default("MULTIPLE"),
  isRequired: z.boolean().default(false),
  minSelections: z.coerce.number().int().min(0).default(0),
  maxSelections: z.coerce.number().int().min(1).optional().nullable(),
  options: z.array(
    z.object({
      name: z.string().min(1, "Option name is required").max(100),
      priceDelta: z.coerce.number().int().min(0).default(0),
      dietaryType: z.enum(["VEG", "NON_VEG", "EGG", "VEGAN", "NONE"]).default("VEG"),
      isAvailable: z.boolean().default(true),
    })
  ).min(1, "At least one option is required"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug);

    const { searchParams } = new URL(request.url);
    const menuItemId = searchParams.get("menuItemId");

    if (menuItemId) {
      const itemGroups = await ModifiersService.getItemModifierGroups(menuItemId);
      return NextResponse.json({ success: true, data: itemGroups });
    }

    const groups = await ModifiersService.listCafeModifierGroups(cafe.id);
    return NextResponse.json({ success: true, data: groups });
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

    const validated = createModifierGroupSchema.parse(body);
    const created = await ModifiersService.createModifierGroup(cafe.id, validated);

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
