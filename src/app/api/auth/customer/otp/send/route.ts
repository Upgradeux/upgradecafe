import { NextRequest, NextResponse } from "next/server";
import { generateSecureOtp, normalizeOtpTarget, removeOtp, storeOtp } from "@/lib/auth/otp-store";
import { sendOtpEmail } from "@/lib/email/email-service";
import { checkRateLimit } from "@/lib/rate-limit/rate-limiter";
import { db } from "@/lib/db";
import { cafes } from "@/lib/db/schema/cafes";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, cafeSlug } = body;

    if (!target || typeof target !== "string") {
      return NextResponse.json(
        { success: false, message: "Phone number or email address is required." },
        { status: 400 }
      );
    }

    const cleanTarget = target.trim();
    const isEmail = cleanTarget.includes("@");

    // Proper input validation
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanTarget)) {
        return NextResponse.json(
          { success: false, message: "Please enter a valid email address (e.g. name@example.com)." },
          { status: 400 }
        );
      }
    } else {
      // Validate mobile: 10 digits, optionally with +91 or leading 0
      const digitsOnly = cleanTarget.replace(/\D/g, "");
      const tenDigitPhone = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;

      const indianPhoneRegex = /^[6-9]\d{9}$/;
      if (!indianPhoneRegex.test(tenDigitPhone)) {
        return NextResponse.json(
          {
            success: false,
            message: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
          },
          { status: 400 }
        );
      }
    }

    const normalizedTarget = normalizeOtpTarget(cleanTarget);
    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientIp = forwardedFor || req.headers.get("x-real-ip") || "unknown";
    await checkRateLimit("CUSTOMER_OTP", `target:${normalizedTarget}`);
    await checkRateLimit("CUSTOMER_OTP", `ip:${clientIp}`);

    let cafeName = "UpgradeCafe";
    if (typeof cafeSlug === "string" && cafeSlug.length <= 120) {
      const [cafe] = await db
        .select({ name: cafes.name })
        .from(cafes)
        .where(eq(cafes.slug, cafeSlug))
        .limit(1);
      if (cafe?.name) cafeName = cafe.name;
    }

    // Generate random 6-digit code
    const code = generateSecureOtp();

    await storeOtp(normalizedTarget, code, 300);

    let delivered = false;

    // If email, send real email verification
    if (isEmail) {
      const result = await sendOtpEmail({
        to: normalizedTarget,
        cafeName,
        code,
        expiresInSeconds: 300,
      });
      delivered = result.success;
      if (!delivered) console.error("[OTP] Email provider did not accept the verification email.");
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile phone authentication is handled securely via Firebase Phone Auth.",
        },
        { status: 400 }
      );
    }

    if (!delivered) {
      await removeOtp(normalizedTarget);
      return NextResponse.json(
        {
          success: false,
          message: isEmail
            ? "We could not send the email code. Please try again or contact the café."
            : "We could not send the SMS code. Please try again or contact the café.",
        },
        { status: 503 }
      );
    }

    // CRITICAL: NEVER return the code in the response body! Only return status and expiry
    return NextResponse.json({
      success: true,
      message: isEmail ? "Verification code sent to your email address." : "Verification code sent by SMS.",
      expiresInSeconds: 300,
      targetType: isEmail ? "email" : "phone",
    });
  } catch (err: any) {
    if (err?.code === "RATE_LIMITED") {
      return NextResponse.json(
        { success: false, message: "Too many code requests. Wait a few minutes and try again." },
        { status: 429 }
      );
    }
    console.error("[OTP Send Error]:", err);
    return NextResponse.json(
      { success: false, message: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
