import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { AppError } from "@/lib/errors/app-error";
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_TOTAL_IMAGES_SIZE_BYTES,
  MAX_IMAGES_PER_ITEM,
  formatFileSize,
} from "@/features/cafe/menu/utils/image-helpers";
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

    const uploadedUrls: Array<{ url: string; name: string; size: number }> = [];

    for (const file of files) {
      const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
      const key = storageService.generateKey(cafe.id, "menu", extension);
      const { publicUrl } = await storageService.upload(
        key,
        new Uint8Array(await file.arrayBuffer()),
        file.type
      );
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
