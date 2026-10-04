import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
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
    const file = formData.get("image") as File | null;

    if (!file) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "No image file provided.",
        statusCode: 400,
      });
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Please upload a PNG, JPG, WEBP, or AVIF image.",
        statusCode: 400,
      });
    }

    // 5 MB max
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Image file size must be under 5 MB.",
        statusCode: 400,
      });
    }

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : file.type === "image/avif"
        ? "avif"
        : "jpg";

    const key = storageService.generateKey(cafe.id, "cover", extension);
    const { publicUrl } = await storageService.upload(
      key,
      new Uint8Array(await file.arrayBuffer()),
      file.type
    );

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: publicUrl,
      },
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
