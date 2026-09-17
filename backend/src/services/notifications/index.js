import prisma from '../../config/prisma.js';
import { getIO } from '../../sockets/index.js';
import { parsePreferences, IN_APP_TYPES, EMAIL_TYPES, WHATSAPP_TYPES } from '../../utils/notificationPreferences.js';
import { sendEmail } from './emailProvider.js';

async function recordDelivery(notificationId, channel, result, provider) {
  try {
    await prisma.notificationDelivery.create({
      data: {
        notificationId,
        channel,
        status: result.skipped ? 'SKIPPED' : result.success ? 'SENT' : 'FAILED',
        provider,
        providerMessageId: result.providerMessageId || null,
        failureReason: result.success || result.skipped ? null : String(result.error || 'Unknown error').slice(0, 500),
        deliveredAt: result.success ? new Date() : null,
      },
    });
  } catch (err) {
    // A logging failure must never surface anywhere near the user.
    console.error('Failed to record notification delivery log:', err);
  }
}

/**
 * The single entry point for creating a notification and fanning it out to
 * every channel the recipient has opted into. Backward compatible with the
 * original signature ({recipientId, type, title, body, data}) used across
 * ~10 existing call sites — email/whatsapp are opt-in extras a caller can
 * additionally provide.
 *
 * @param {object} params
 * @param {string} params.recipientId
 * @param {string} [params.senderId]
 * @param {string} params.type
 * @param {string} params.title
 * @param {string} [params.body]
 * @param {string} [params.conversationId]
 * @param {string} [params.messageId]
 * @param {object} [params.data] - extra JSON metadata (unrelated to email/whatsapp content)
 * @param {object} [params.email] - { subject, title, bodyHtml, ctaLabel, ctaUrl } — content for the email channel, if this type supports it and the recipient opted in
 * @param {(recipient: object) => Promise<{success:boolean, providerMessageId?:string, error?:string, skipped?:boolean}>} [params.whatsappSend] - called with the full recipient user row (for phone number) if this type supports WhatsApp and the recipient opted in + verified their number
 */
export async function createNotification({
  recipientId,
  senderId = null,
  type,
  title,
  body,
  conversationId = null,
  messageId = null,
  data,
  email,
  whatsappSend,
}) {
  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient || recipient.status !== 'ACTIVE') return null;

  const prefs = parsePreferences(recipient.notificationPreferences);

  // Types not in IN_APP_TYPES (e.g. moderation-adjacent ones, if any exist)
  // are always delivered in-app — only the ones the settings page exposes
  // can be turned off.
  const inAppEnabled = !IN_APP_TYPES.includes(type) || prefs.inApp[type] !== false;

  let notification = null;
  if (inAppEnabled) {
    notification = await prisma.notification.create({
      data: {
        recipientId,
        senderId,
        type,
        title,
        body: body || null,
        conversationId,
        messageId,
        data: data ? JSON.stringify(data) : null,
      },
    });

    const io = getIO();
    if (io) {
      io.to(`user:${recipientId}`).emit('notification', { ...notification, data: data || null });
    }
  }

  // Everything below is fire-and-forget: a slow or failing email/WhatsApp
  // provider must never delay or fail the caller's action (e.g. the "I Miss
  // You" tap already succeeded the moment the in-app notification was made).
  if (email && EMAIL_TYPES.includes(type) && prefs.email[type]) {
    sendEmail({ to: recipient.email, ...email })
      .then((result) => notification && recordDelivery(notification.id, 'EMAIL', result, 'resend'))
      .catch((err) => console.error('Email notification failed:', err));
  }

  if (whatsappSend && WHATSAPP_TYPES.includes(type) && prefs.whatsapp[type] && recipient.whatsappVerified && recipient.whatsappNumber) {
    Promise.resolve(whatsappSend(recipient))
      .then((result) => notification && recordDelivery(notification.id, 'WHATSAPP', result, 'meta_cloud_api'))
      .catch((err) => console.error('WhatsApp notification failed:', err));
  }

  return notification;
}
