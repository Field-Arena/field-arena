import 'server-only';
import { env } from '@/shared/lib/env';

const FROM = 'Field & Arena <notifications@field-arena.com>';

/* Single place every outbound transactional email goes through. Mirrors the
 * legacy api/_lib/email.js contract: it never throws on a delivery failure --
 * callers decide what a failed send means for their own row (usually "the
 * record is real either way, surface the failure, don't roll it back"). */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
