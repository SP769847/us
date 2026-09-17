// WhatsApp Business Platform (Cloud API) client — NOT WhatsApp Web scraping,
// NOT automating a personal account. https://developers.facebook.com/docs/whatsapp/cloud-api
//
// Meta requires messages sent outside an active 24h customer-service session
// to use a pre-approved message template (this is virtually always the case
// here, since these are proactive app-triggered notifications). Template
// names/languages must be created and approved in the Meta Business Manager
// first — this module only calls them by name via env vars; it cannot create
// or approve templates itself.
//
// If WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID are not set, every call
// is a no-op that reports SKIPPED, exactly like the email provider.

const GRAPH_VERSION = 'v21.0';

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

async function callGraphApi(body) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = json?.error?.message || `WhatsApp API returned ${res.status}`;
    return { success: false, error };
  }
  return { success: true, providerMessageId: json?.messages?.[0]?.id || null };
}

// Sends a pre-approved template message. `components` follows Meta's shape,
// e.g. [{ type: 'body', parameters: [{ type: 'text', text: 'Priti' }] }].
export async function sendTemplateMessage({ to, templateName, languageCode = 'en', components = [] }) {
  if (!isWhatsAppConfigured()) {
    return { success: false, skipped: true, error: 'WhatsApp provider not configured' };
  }
  try {
    return await callGraphApi({
      to,
      type: 'template',
      template: { name: templateName, language: { code: languageCode }, components },
    });
  } catch (err) {
    return { success: false, error: err.message || 'WhatsApp send failed' };
  }
}

// OTP verification message. Requires an approved "Authentication" category
// template in Meta Business Manager — set WHATSAPP_OTP_TEMPLATE_NAME to its
// exact name (Meta's default authentication templates typically expect a
// single body parameter: the code, plus a copy-code button).
export async function sendOtpMessage({ to, code }) {
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'otp_verification';
  return sendTemplateMessage({
    to,
    templateName,
    components: [
      { type: 'body', parameters: [{ type: 'text', text: code }] },
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
    ],
  });
}

// "I Miss You" / "Waiting for reply" notification templates. Names are
// configurable since the exact approved template text/name will vary per
// Meta Business account — these are not guessable in advance.
export async function sendMissYouMessage({ to, senderName, appUrl }) {
  const templateName = process.env.WHATSAPP_MISS_YOU_TEMPLATE_NAME || 'miss_you_notification';
  return sendTemplateMessage({
    to,
    templateName,
    components: [{ type: 'body', parameters: [{ type: 'text', text: senderName }, { type: 'text', text: appUrl }] }],
  });
}

export async function sendConnectionRequestMessage({ to, senderName, appUrl }) {
  const templateName = process.env.WHATSAPP_CONNECTION_REQUEST_TEMPLATE_NAME || 'connection_request_notification';
  return sendTemplateMessage({
    to,
    templateName,
    components: [{ type: 'body', parameters: [{ type: 'text', text: senderName }, { type: 'text', text: appUrl }] }],
  });
}

export async function sendWaitingReplyMessage({ to, senderName, appUrl }) {
  const templateName = process.env.WHATSAPP_WAITING_REPLY_TEMPLATE_NAME || 'waiting_for_reply_notification';
  return sendTemplateMessage({
    to,
    templateName,
    components: [{ type: 'body', parameters: [{ type: 'text', text: senderName }, { type: 'text', text: appUrl }] }],
  });
}
