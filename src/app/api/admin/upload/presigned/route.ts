import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/permissions/guards";
import { storageService } from "@/lib/storage/storage.service";
import { formatErrorResponse } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin();
    storageService.assertConfigured();

    const body = await req.json();
    const { cafeId, category, contentType, extension } = body;

    if (!cafeId || !category) {
      return NextResponse.json(
        { success: false, error: { message: "cafeId and category are required" } },
        { status: 400 }
      );
    }

    const key = storageService.generateKey(
      cafeId,
      category as "logo" | "cover" | "menu" | "files",
      extension || "webp"
    );

    const presigned = await storageService.createSignedUploadUrl(
      key,
      contentType || "image/webp"
    );

    return NextResponse.json({ success: true, data: presigned });
  } catch (err) {
    const errorResponse = formatErrorResponse(err);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
