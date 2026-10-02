import { auth } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { checkRateLimit } from "@/lib/rate-limit/rate-limiter";
import { formatErrorResponse } from "@/lib/errors/app-error";

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  try {
    if (new URL(request.url).pathname.endsWith("/sign-in/email")) {
      const ipAddress = request.headers.get("x-real-ip")
        || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || "unknown";
      await checkRateLimit("ADMIN_LOGIN", ipAddress);
    }

    return await handlers.POST(request);
  } catch (error) {
    const response = formatErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
