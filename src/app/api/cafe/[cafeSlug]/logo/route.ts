import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import { storageService } from "@/lib/storage/storage.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;
    const { cafe } = await resolveCafeTenant(cafeSlug, ["OWNER", "MANAGER"]);
    storageService.assertConfigured();

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

    const key = storageService.generateKey(cafe.id, "logo", extension);
    const { publicUrl } = await storageService.upload(
      key,
      new Uint8Array(await file.arrayBuffer()),
      file.type
    );

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

    const oldLogo = cafe.logoKey;
    await db
      .update(cafes)
      .set({
        logoKey: null,
        updatedAt: new Date(),
      })
      .where(eq(cafes.id, cafe.id));

    if (oldLogo?.startsWith(`${process.env.R2_PUBLIC_URL?.replace(/\/$/, "")}/`)) {
      const key = oldLogo.slice(process.env.R2_PUBLIC_URL!.replace(/\/$/, "").length + 1);
      await storageService.delete(decodeURIComponent(key)).catch((error) => {
        console.error("Failed to remove old café logo from R2:", error);
      });
    }

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
