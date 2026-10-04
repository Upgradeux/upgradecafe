import { NextRequest, NextResponse } from "next/server";
import { normalizeOtpTarget, verifyOtp } from "@/lib/auth/otp-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, code, name } = body;

    if (!target || !code) {
      return NextResponse.json(
        { success: false, message: "Target and verification code are required." },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json(
        { success: false, message: "Verification code must be exactly 6 digits." },
        { status: 400 }
      );
    }

    const normalizedTarget = normalizeOtpTarget(String(target));
    const result = await verifyOtp(normalizedTarget, cleanCode);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: 400 }
      );
    }

    // Success! Build authenticated customer payload
    const isEmail = normalizedTarget.includes("@");
    const cleanPhone = !isEmail ? `+${normalizedTarget}` : undefined;
    const cleanEmail = isEmail ? normalizedTarget : undefined;

    return NextResponse.json({
      success: true,
      message: "Successfully verified.",
      customer: {
        id: `cust_${Date.now()}`,
        name: typeof name === "string" && name.trim()
          ? name.trim().slice(0, 100)
          : cleanEmail
            ? cleanEmail.split("@")[0]
            : `Member ${cleanPhone?.slice(-4)}`,
        email: cleanEmail,
        phone: cleanPhone,
        isGuest: false,
      },
    });
  } catch (err: any) {
    console.error("[OTP Verify Error]:", err);
    return NextResponse.json(
      { success: false, message: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
