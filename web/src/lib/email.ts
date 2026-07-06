// Transactional email via Resend (2FA codes, verification). HTML + text.
// Monochrome, hard-edged — matches the site.
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.MAIL_FROM ?? "BUR <no-reply@bur.mmzsigmond.me>";

function codeEmail(opts: { title: string; intro: string; code: string; note: string }): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #06463c;">
          <tr><td style="background:#06463c;padding:18px 26px;">
            <span style="color:#ffffff;font-size:17px;font-weight:800;letter-spacing:-0.02em;">BUR</span>
            <span style="color:#8a8a8a;font-size:12px;font-weight:500;margin-left:8px;">Blueberry User Repository</span>
          </td></tr>
          <tr><td style="padding:32px 26px;">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#06463c;">${opts.title}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5b5b67;">${opts.intro}</p>
            <div style="text-align:center;margin:0 0 24px;">
              <span style="display:inline-block;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:30px;font-weight:800;letter-spacing:10px;color:#06463c;background:#f4f4f4;border:1px solid #06463c;padding:16px 20px 16px 30px;">${opts.code}</span>
            </div>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#8a8a8a;">${opts.note}</p>
          </td></tr>
          <tr><td style="padding:16px 26px;border-top:1px solid #06463c;background:#06463c;">
            <p style="margin:0;font-size:12px;color:#8a8a8a;">Blueberry User Repository &middot; community package repository</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendTwoFactorCode(to: string, code: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your BUR sign-in code",
    text: `Your Blueberry User Repository sign-in code is: ${code}\n\nIt expires in 10 minutes. If you did not try to sign in, you can ignore this email.`,
    html: codeEmail({
      title: "Sign-in verification",
      intro: "Use this code to finish signing in to your BUR account.",
      code,
      note: "This code expires in 10 minutes. If you did not try to sign in, you can safely ignore this email.",
    }),
  });
}

export async function sendEmailVerification(to: string, code: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your BUR email",
    text: `Welcome to the Blueberry User Repository.\n\nYour verification code is: ${code}\n\nIt expires in 10 minutes.`,
    html: codeEmail({
      title: "Confirm your email",
      intro: "Welcome to the Blueberry User Repository. Use this code to verify your email address.",
      code,
      note: "This code expires in 10 minutes.",
    }),
  });
}
