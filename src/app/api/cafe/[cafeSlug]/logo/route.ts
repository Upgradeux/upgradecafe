import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "No logo image file provided.",
        statusCode: 400,
      });
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "image/avif",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Please upload a PNG, JPG, WEBP, or SVG logo image.",
        statusCode: 400,
      });
    }

    // 5 MB max
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Logo file size must be under 5 MB.",
        statusCode: 400,
      });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "cafes", cafe.slug, "branding");
    await fs.mkdir(uploadDir, { recursive: true });

    const extension =
      file.type === "image/svg+xml"
        ? "svg"
        : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : file.type === "image/avif"
        ? "avif"
        : "jpg";

    const fileName = `logo-${Date.now()}-${crypto.randomUUID().slice(0, 6)}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    const publicUrl = `/uploads/cafes/${cafe.slug}/branding/${fileName}`;

    // Update authoritative cafe record in database (shared with Super Admin & Public Menu)
    await db
      .update(cafes)
      .set({
        logoKey: publicUrl,
        updatedAt: new Date(),
      })
      .where(eq(cafes.id, cafe.id));

    return NextResponse.json({
      success: true,
      data: {
        logoKey: publicUrl,
      },
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);

    await db
      .update(cafes)
      .set({
        logoKey: null,
        updatedAt: new Date(),
      })
      .where(eq(cafes.id, cafe.id));

    return NextResponse.json({
      success: true,
      data: {
        logoKey: null,
      },
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
