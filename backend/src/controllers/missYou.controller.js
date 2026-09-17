import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeText } from '../utils/validators.js';
import { escapeHtml } from '../utils/html.js';
import { requireMembership, getOtherMemberId } from '../services/chatService.js';
import { isBlockedEitherWay } from '../services/connectionService.js';
import { createNotification } from '../services/notificationService.js';
import { sendMissYouMessage } from '../services/notifications/whatsappProvider.js';
import { missYouCooldownHours, hoursAgo } from '../utils/notificationConfig.js';
import { getIO } from '../sockets/index.js';
import { MESSAGE_INCLUDE, serializeMessage } from './messages.controller.js';

const DEFAULT_MISS_YOU_TEXT = 'Missing you ❤️';

export const sendMissYou = asyncHandler(async (req, res) => {
  const { conversationId, sendChatMessage, chatMessageText } = req.body;
  if (!conversationId) throw new ApiError(400, 'conversationId is required');

  // Sender identity always comes from the authenticated session — never
  // trust a client-supplied sender id.
  await requireMembership(conversationId, req.user.id);
  const recipientId = await getOtherMemberId(conversationId, req.user.id);
  if (!recipientId) throw new ApiError(400, 'This conversation has no other participant');

  if (await isBlockedEitherWay(req.user.id, recipientId)) {
    throw new ApiError(403, 'You cannot use this feature with this user');
  }

  const cooldownStart = hoursAgo(missYouCooldownHours());
  const recent = await prisma.notification.findFirst({
    where: { type: 'MISS_YOU', senderId: req.user.id, recipientId, createdAt: { gt: cooldownStart } },
    orderBy: { createdAt: 'desc' },
  });
  if (recent) {
    const nextAvailable = new Date(recent.createdAt.getTime() + missYouCooldownHours() * 60 * 60 * 1000);
    const minutesLeft = Math.max(1, Math.ceil((nextAvailable.getTime() - Date.now()) / 60000));
    throw new ApiError(
      429,
      minutesLeft < 60
        ? `You can send another Miss You in about ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`
        : `You can send another Miss You in about ${Math.ceil(minutesLeft / 60)} hour${Math.ceil(minutesLeft / 60) === 1 ? '' : 's'}.`
    );
  }

  let serializedMessage = null;
  let createdMessageId = null;

  if (sendChatMessage) {
    const text = sanitizeText(chatMessageText, 200) || DEFAULT_MISS_YOU_TEXT;
    const message = await prisma.message.create({
      data: { conversationId, senderId: req.user.id, type: 'MISS_YOU', content: text },
      include: MESSAGE_INCLUDE,
    });
    createdMessageId = message.id;
    serializedMessage = serializeMessage(message, req.user.id);

    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit('new-message', serializedMessage);
    }
  }

  const appUrl = process.env.APP_URL || '';
  await createNotification({
    recipientId,
    senderId: req.user.id,
    type: 'MISS_YOU',
    title: `❤️ ${req.user.fullName} misses you`,
    body: "They're thinking about you and would love to hear from you.",
    conversationId,
    messageId: createdMessageId,
    email: {
      subject: '❤️ Someone is thinking about you',
      title: '❤️ Someone is thinking about you',
      bodyHtml: `<p><strong>${escapeHtml(req.user.fullName)}</strong> is thinking about you ❤️</p><p>They sent you an "I Miss You" notification. Open your private conversation to see them.</p>`,
      ctaLabel: 'Open Chat',
      ctaUrl: appUrl ? `${appUrl}/chat/${conversationId}` : undefined,
    },
    whatsappSend: (recipient) =>
      sendMissYouMessage({ to: recipient.whatsappNumber, senderName: req.user.fullName, appUrl: appUrl ? `${appUrl}/chat/${conversationId}` : '' }),
  });

  res.status(201).json({ message: serializedMessage });
});
