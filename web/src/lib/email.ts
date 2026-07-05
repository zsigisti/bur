// Transactional email via Resend (2FA codes, verification).
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.MAIL_FROM ?? "BUR <no-reply@bur.mmzsigmond.me>";

export async function sendTwoFactorCode(to: string, code: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your BUR sign-in code",
    text: `Your Blueberry User Repository sign-in code is: ${code}\n\nIt expires in 10 minutes. If you did not try to sign in, ignore this email.`,
  });
}

export async function sendEmailVerification(to: string, code: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your BUR email",
    text: `Welcome to the Blueberry User Repository.\n\nYour verification code is: ${code}\n\nIt expires in 10 minutes.`,
  });
}
