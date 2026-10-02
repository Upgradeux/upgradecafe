import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/auth/otp-store";

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

    const result = verifyOtp(target, cleanCode);

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
    const isEmail = target.includes("@");
    const cleanPhone = !isEmail ? target : undefined;
    const cleanEmail = isEmail ? target : undefined;

    return NextResponse.json({
      success: true,
      message: "Successfully verified.",
      customer: {
        id: `cust_${Date.now()}`,
        name: name || (cleanEmail ? cleanEmail.split("@")[0] : `Member ${cleanPhone?.slice(-4) || "8888"}`),
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
