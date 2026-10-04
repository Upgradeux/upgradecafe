import nodemailer from "nodemailer";

interface SendOtpEmailOptions {
  to: string;
  cafeName: string;
  code: string;
  expiresInSeconds?: number;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

export async function sendOtpEmail({
  to,
  cafeName,
  code,
  expiresInSeconds = 300,
}: SendOtpEmailOptions): Promise<{ success: boolean; mode: string; error?: string }> {
  const safeCafeName = escapeHtml(cafeName);
  const subject = `Your ${cafeName} verification code`;
  const text = `Your ${cafeName} verification code is ${code}. It expires in ${Math.ceil(expiresInSeconds / 60)} minutes.`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#242321;padding:24px"><main style="max-width:480px;margin:auto;border:1px solid #e7e4dd;border-radius:12px;padding:28px;text-align:center"><h1 style="font-size:20px">${safeCafeName}</h1><p>Use this code to verify your account:</p><p style="font-family:monospace;font-size:32px;letter-spacing:8px;font-weight:700">${code}</p><p>This code expires in ${Math.ceil(expiresInSeconds / 60)} minutes.</p><p style="color:#73716b;font-size:12px">If you did not request this code, you can ignore this email.</p></main></body></html>`;

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  ) {
    try {
      const port = Number(process.env.SMTP_PORT || 587);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: process.env.SMTP_SECURE === "true" || port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html, text });
      return { success: true, mode: "smtp" };
    } catch (error) {
      console.error("[EmailService] SMTP delivery failed:", error);
    }
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: process.env.RESEND_FROM, to: [to], subject, html, text }),
      });
      if (response.ok) return { success: true, mode: "resend" };
      console.error(`[EmailService] Resend rejected OTP email with HTTP ${response.status}.`);
    } catch (error) {
      console.error("[EmailService] Resend delivery failed:", error);
    }
  }

  return {
    success: false,
    mode: "unconfigured",
    error: "Email delivery is not configured. Set SMTP credentials or RESEND_API_KEY and RESEND_FROM.",
  };
}
