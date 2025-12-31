import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"PropMarket" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your PropMarket Login Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">PropMarket Login Verification</h2>
          <div style="background-color: #f5f5f5; padding: 30px; border-radius: 8px; text-align: center;">
            <p style="font-size: 16px; color: #666; margin-bottom: 20px;">Your one-time verification code is:</p>
            <div style="background-color: #fff; padding: 20px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #999; margin-top: 20px;">This code expires in 5 minutes.</p>
          </div>
          <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
      text: `Your PropMarket verification code is: ${otp}. This code expires in 5 minutes.`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
