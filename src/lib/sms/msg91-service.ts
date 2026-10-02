/**
 * MSG91 SMS & OTP Service for CAFEFLOW / UpgradeCafe
 *
 * Flow:
 * Customer -> Enter phone number -> Better Auth -> Generate OTP -> MSG91 -> SMS -> Customer enters OTP -> Verified!
 *
 * Current MSG91 India OTP rates start around ₹0.25/OTP (5000 volume).
 * Message template: "Your CAFEFLOW verification code is {code}"
 */

export interface SendOtpParams {
  phoneNumber: string;
  code: string;
  senderId?: string;
  cafeName?: string;
}

export async function sendMsg91Otp({
  phoneNumber,
  code,
  senderId = process.env.MSG91_SENDER_ID || "CAFEFL",
  cafeName = "CAFEFLOW",
}: SendOtpParams): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;

  // Clean and normalize Indian mobile number
  // Format to standard 91XXXXXXXXXX without + or spaces
  const digits = phoneNumber.replace(/\D/g, "");
  const mobile = digits.length === 10 ? `91${digits}` : digits;

  console.log(`\n======================================================`);
  console.log(`📱 [MSG91 SMS GATEWAY] Dispatching OTP SMS to: +${mobile}`);
  console.log(`☕ Service: ${cafeName}`);
  console.log(`💬 Message: "Your CAFEFLOW verification code is ${code}"`);
  console.log(`⏳ Code strictly valid for: 5 minutes (Better Auth OTP)`);
  console.log(`======================================================\n`);

  if (!authKey) {
    console.warn(
      `[MSG91] No MSG91_AUTH_KEY set in environment. Running in development simulation mode.`
    );
    return { success: true, simulated: true };
  }

  try {
    // MSG91 Send OTP API endpoint
    // https://control.msg91.com/api/v5/otp
    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("mobile", mobile);
    url.searchParams.set("otp", code);
    url.searchParams.set("otp_expiry", "5"); // 5 minutes
    if (templateId) {
      url.searchParams.set("template_id", templateId);
    }
    if (senderId) {
      url.searchParams.set("sender", senderId);
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "authkey": authKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        otp: code,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.type === "error") {
      console.error("[MSG91 Error Response]:", data);
      return { success: false, error: data.message || "MSG91 dispatch failed" };
    }

    console.log(`[MSG91 Success]: Dispatched message ID: ${data.message}`);
    return { success: true, messageId: data.message };
  } catch (error: any) {
    console.error("[MSG91 Exception]:", error);
    return { success: false, error: error.message || "Failed to contact MSG91" };
  }
}
