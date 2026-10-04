import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { ModifiersService } from "@/features/cafe/menu/services/modifiers.service";
import { AppError } from "@/lib/errors/app-error";
import { z } from "zod";

const updateModifierGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(250).optional(),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]).optional(),
  isRequired: z.boolean().optional(),
  minSelections: z.coerce.number().int().min(0).optional(),
  maxSelections: z.coerce.number().int().min(1).optional().nullable(),
  options: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1).max(100),
      priceDelta: z.coerce.number().int().min(0).default(0),
      dietaryType: z.enum(["VEG", "NON_VEG", "EGG", "VEGAN", "NONE"]).default("VEG").optional(),
      isAvailable: z.boolean().default(true),
    })
  ).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; groupId: string }> }
) {
  try {
    const { cafeSlug, groupId } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);
    const body = await request.json();

    const validated = updateModifierGroupSchema.parse(body);
    const updated = await ModifiersService.updateModifierGroup(groupId, cafe.id, validated);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return AppError.toResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string; groupId: string }> }
) {
  try {
    const { cafeSlug, groupId } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);

    const deleted = await ModifiersService.deleteModifierGroup(groupId, cafe.id);
    if (!deleted) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Modifier group not found or already deleted",
        statusCode: 404,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
