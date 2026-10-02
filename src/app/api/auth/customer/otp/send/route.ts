import { NextRequest, NextResponse } from "next/server";
import { generateSecureOtp, storeOtp } from "@/lib/auth/otp-store";
import { sendOtpEmail } from "@/lib/email/email-service";
import { sendMsg91Otp } from "@/lib/sms/msg91-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, cafeName = "The Roasted Bean" } = body;

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

    // Generate random 6-digit code
    const code = generateSecureOtp();

    // Store with Better Auth 5-minute (300-second) TTL and 3 verification attempts
    storeOtp(cleanTarget, code, 300);

    // If email, send real email verification
    if (isEmail) {
      await sendOtpEmail({
        to: cleanTarget,
        cafeName,
        code,
        expiresInSeconds: 300,
      });
    } else {
      // For SMS mobile numbers, dispatch via MSG91 SMS Gateway
      await sendMsg91Otp({
        phoneNumber: cleanTarget,
        code,
        cafeName,
      });
    }

    // CRITICAL: NEVER return the code in the response body! Only return status and expiry
    return NextResponse.json({
      success: true,
      message: isEmail
        ? `Verification code dispatched to ${cleanTarget}`
        : `Your CAFEFLOW verification code has been dispatched via MSG91 SMS`,
      expiresInSeconds: 300,
      targetType: isEmail ? "email" : "phone",
    });
  } catch (err: any) {
    console.error("[OTP Send Error]:", err);
    return NextResponse.json(
      { success: false, message: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
