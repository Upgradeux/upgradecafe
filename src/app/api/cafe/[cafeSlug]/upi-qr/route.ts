import { NextRequest, NextResponse } from "next/server";
import { resolveCafeTenant } from "@/lib/auth/tenant-context";
import { db } from "@/lib/db";
import { cafeSettings } from "@/lib/db/schema/cafe-settings";
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
    const file = formData.get("upiQr") as File | null;

    if (!file) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "No UPI QR code image file provided.",
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
        message: "Please upload a PNG, JPG, WEBP, or SVG image of your UPI QR code.",
        statusCode: 400,
      });
    }

    // 5 MB max
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "QR code image size must be under 5 MB.",
        statusCode: 400,
      });
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "cafes",
      cafe.slug,
      "upi"
    );
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

    const fileName = `upi-qr-${Date.now()}-${crypto.randomUUID().slice(0, 6)}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    const publicUrl = `/uploads/cafes/${cafe.slug}/upi/${fileName}`;

    // Upsert into cafeSettings
    const [existing] = await db
      .select({ id: cafeSettings.id })
      .from(cafeSettings)
      .where(eq(cafeSettings.cafeId, cafe.id))
      .limit(1);

    if (existing) {
      await db
        .update(cafeSettings)
        .set({
          upiQrUrl: publicUrl,
          upiQrKey: fileName,
          updatedAt: new Date(),
        })
        .where(eq(cafeSettings.cafeId, cafe.id));
    } else {
      await db.insert(cafeSettings).values({
        cafeId: cafe.id,
        upiQrUrl: publicUrl,
        upiQrKey: fileName,
      });
    }

    return NextResponse.json({
      success: true,
      message: "UPI QR code uploaded successfully.",
      data: {
        upiQrUrl: publicUrl,
        upiQrKey: fileName,
      },
    });
  } catch (err) {
    return AppError.toResponse(err);
  }
}
