import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { AppError } from "@/lib/errors/app-error";
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_TOTAL_IMAGES_SIZE_BYTES,
  MAX_IMAGES_PER_ITEM,
  formatFileSize,
} from "@/features/cafe/menu/utils/image-helpers";
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
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "No files provided for upload.",
        statusCode: 400,
      });
    }

    if (files.length > MAX_IMAGES_PER_ITEM) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: `You can upload a maximum of ${MAX_IMAGES_PER_ITEM} images for one item.`,
        statusCode: 400,
      });
    }

    // Check individual file size and total size
    let totalSize = 0;
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.type)) {
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: `"${file.name}" has an unsupported format. Please upload JPG, PNG, WEBP, or AVIF.`,
          statusCode: 400,
        });
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: `"${file.name}" (${formatFileSize(file.size)}) exceeds the maximum allowed 5 MB per image.`,
          statusCode: 400,
        });
      }

      totalSize += file.size;
    }

    if (totalSize > MAX_TOTAL_IMAGES_SIZE_BYTES) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: `Total upload size (${formatFileSize(totalSize)}) exceeds the 12 MB maximum allowed for 3 images.`,
        statusCode: 400,
      });
    }

    // Prepare target directory in public/uploads/cafes/[slug]/menu/
    const uploadDir = path.join(process.cwd(), "public", "uploads", "cafes", cafe.slug, "menu");
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedUrls: Array<{ url: string; name: string; size: number }> = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Determine clean extension
      const extension = file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : file.type === "image/avif"
        ? "avif"
        : "jpg";

      const uniqueFileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
      const filePath = path.join(uploadDir, uniqueFileName);

      await fs.writeFile(filePath, buffer);

      const publicUrl = `/uploads/cafes/${cafe.slug}/menu/${uniqueFileName}`;
      uploadedUrls.push({
        url: publicUrl,
        name: file.name,
        size: file.size,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        images: uploadedUrls,
        totalSize,
      },
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
