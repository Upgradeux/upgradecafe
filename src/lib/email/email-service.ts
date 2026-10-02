import nodemailer from "nodemailer";

interface SendOtpEmailOptions {
  to: string;
  cafeName: string;
  code: string;
  expiresInSeconds?: number;
}

export async function sendOtpEmail({
  to,
  cafeName,
  code,
  expiresInSeconds = 30,
}: SendOtpEmailOptions): Promise<{ success: boolean; mode: string; error?: string }> {
  const subject = `Your ${cafeName} Verification Code: ${code}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F6; margin: 0; padding: 24px; color: #1C1D1A; }
          .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #EAE6DF; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
          .header { background: #8B4513; padding: 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
          .content { padding: 32px 24px; text-align: center; }
          .code-box { display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #8B4513; background: #F8F6F2; padding: 14px 28px; border-radius: 12px; border: 1.5px dashed #D6CEC5; margin: 20px 0; font-family: monospace; }
          .warning { color: #DC2626; font-size: 13px; font-weight: 600; margin-top: 12px; }
          .footer { padding: 16px 24px; background: #F8F6F2; border-top: 1px solid #EAE6DF; font-size: 11px; color: #8C8A84; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${cafeName}</h1>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; margin: 0 0 8px;">Verification Code</h2>
            <p style="color: #666; font-size: 14px; margin: 0 0 16px;">Use the code below to securely verify your access.</p>
            <div class="code-box">${code}</div>
            <p class="warning">⚠️ This code expires in exactly ${expiresInSeconds} seconds.</p>
            <p style="color: #888; font-size: 12px; margin-top: 20px;">If you did not request this verification code, please ignore this email.</p>
          </div>
          <div class="footer">
            Good Coffee &bull; Better Moments &bull; ${cafeName}
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Check if SMTP configuration exists in environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"${cafeName}" <noreply@upgradecafe.com>`,
        to,
        subject,
        html,
        text: `Your ${cafeName} verification code is ${code}. Valid for ${expiresInSeconds} seconds.`,
      });

      return { success: true, mode: "smtp" };
    } catch (err: any) {
      console.error("[EmailService] SMTP delivery failed:", err);
      // Fallback to console
    }
  }

  // 2. Check if Resend API Key is set
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || `${cafeName} <onboarding@resend.dev>`,
          to: [to],
          subject,
          html,
        }),
      });

      if (res.ok) {
        return { success: true, mode: "resend" };
      }
    } catch (err: any) {
      console.error("[EmailService] Resend delivery failed:", err);
    }
  }

  // 3. Development / Server Console Log Mode
  // Clean, high-visibility log for development
  console.log(`\n======================================================`);
  console.log(`🔐 [AUTHENTICATION] OTP CODE SENT TO ${to}`);
  console.log(`☕ Cafe: ${cafeName}`);
  console.log(`🔑 Verification Code: [ ${code} ]`);
  console.log(`⏳ Valid For: ${expiresInSeconds} seconds (Expires at ${new Date(Date.now() + expiresInSeconds * 1000).toLocaleTimeString()})`);
  console.log(`======================================================\n`);

  return { success: true, mode: "development_console" };
}
