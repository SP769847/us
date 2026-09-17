// Thin Resend API client (https://resend.com/docs/api-reference/emails/send-email).
// No SDK dependency needed — Node 18+ has native fetch, and this is a single
// POST endpoint with a bearer token. Configured via EMAIL_API_KEY / EMAIL_FROM.
// If not configured, every call is a no-op that reports SKIPPED so the
// calling code (NotificationService) never has to special-case "no provider".

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function isEmailConfigured() {
  return Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);
}

function wrapHtml({ title, bodyHtml, ctaLabel, ctaUrl }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0f0b13;font-family:-apple-system,Segoe UI,Inter,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
      <div style="background:linear-gradient(135deg,#231b28,#171119);border-radius:20px;padding:32px 28px;border:1px solid rgba(255,255,255,0.08);">
        <h1 style="color:#f6cdd6;font-size:20px;margin:0 0 16px;">${title}</h1>
        <div style="color:rgba(255,255,255,0.75);font-size:14px;line-height:1.6;">${bodyHtml}</div>
        ${
          ctaUrl
            ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:24px;padding:12px 24px;border-radius:14px;background:linear-gradient(90deg,#d64f72,#8760b3);color:#fff;text-decoration:none;font-size:14px;font-weight:600;">${ctaLabel || 'Open App'}</a>`
            : ''
        }
      </div>
      <p style="color:rgba(255,255,255,0.25);font-size:11px;text-align:center;margin-top:20px;">
        You can change what you're notified about in your notification settings.
      </p>
    </div>
  </body>
</html>`;
}

// Returns { success, providerMessageId, error }. Never throws — the caller
// records the outcome via NotificationDelivery and must not fail the parent
// action (e.g. the "I Miss You" tap) just because email delivery failed.
export async function sendEmail({ to, subject, title, bodyHtml, ctaLabel, ctaUrl }) {
  if (!isEmailConfigured()) {
    return { success: false, skipped: true, error: 'Email provider not configured' };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject,
        html: wrapHtml({ title, bodyHtml, ctaLabel, ctaUrl }),
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: json?.message || `Email provider returned ${res.status}` };
    }
    return { success: true, providerMessageId: json?.id || null };
  } catch (err) {
    return { success: false, error: err.message || 'Email send failed' };
  }
}
