import prisma from '../config/prisma.js';
import { getOtherMemberId } from './chatService.js';
import { createNotification } from './notificationService.js';
import { sendWaitingReplyMessage } from './notifications/whatsappProvider.js';
import { escapeHtml } from '../utils/html.js';
import { waitingReplyDelayHours, waitingReplyCooldownHours, hoursAgo } from '../utils/notificationConfig.js';

// Derived entirely from existing Message rows — no schema needed to know
// "has B replied since": if the most recent message in the conversation was
// sent by A and nothing from B exists after it, A is waiting.
export async function getWaitingReplyStatus(conversationId, userId) {
  const lastMessage = await prisma.message.findFirst({ where: { conversationId }, orderBy: { createdAt: 'desc' } });
  if (!lastMessage || lastMessage.senderId !== userId) {
    return { waiting: false };
  }

  const recipientId = await getOtherMemberId(conversationId, userId);
  if (!recipientId) return { waiting: false };

  const elapsedMs = Date.now() - new Date(lastMessage.createdAt).getTime();
  if (elapsedMs < waitingReplyDelayHours() * 60 * 60 * 1000) {
    return { waiting: false };
  }

  const alreadyReminded = await prisma.reminderSent.findUnique({ where: { messageId: lastMessage.id } });
  const recentToRecipient = await prisma.reminderSent.findFirst({
    where: { recipientId, createdAt: { gt: hoursAgo(waitingReplyCooldownHours()) } },
  });

  return {
    waiting: true,
    messageId: lastMessage.id,
    recipientId,
    since: lastMessage.createdAt,
    canRemind: !alreadyReminded && !recentToRecipient,
    alreadyReminded: Boolean(alreadyReminded),
  };
}

// Shared by both the manual "Remind them" button and the background
// scheduler — re-validates everything server-side rather than trusting
// whichever caller invoked it, since the scheduler runs unattended.
export async function sendWaitingReplyReminder({ conversationId, senderId, recipientId, messageId }) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.conversationId !== conversationId || message.senderId !== senderId) {
    return { sent: false, reason: 'Message no longer matches' };
  }

  const latest = await prisma.message.findFirst({ where: { conversationId }, orderBy: { createdAt: 'desc' } });
  if (!latest || latest.id !== messageId) {
    return { sent: false, reason: 'Already replied' };
  }

  const elapsedMs = Date.now() - new Date(message.createdAt).getTime();
  if (elapsedMs < waitingReplyDelayHours() * 60 * 60 * 1000) {
    return { sent: false, reason: 'Too soon' };
  }

  const existing = await prisma.reminderSent.findUnique({ where: { messageId } });
  if (existing) return { sent: false, reason: 'Already reminded for this message' };

  const recentToRecipient = await prisma.reminderSent.findFirst({
    where: { recipientId, createdAt: { gt: hoursAgo(waitingReplyCooldownHours()) } },
  });
  if (recentToRecipient) return { sent: false, reason: 'Recipient cooldown active' };

  const sender = await prisma.user.findUnique({ where: { id: senderId } });
  if (!sender) return { sent: false, reason: 'Sender not found' };

  // Record first — if the notification step throws, we'd rather under-remind
  // than double-remind on a retry.
  await prisma.reminderSent.create({ data: { messageId, conversationId, senderId, recipientId } });

  const appUrl = process.env.APP_URL || '';
  await createNotification({
    recipientId,
    senderId,
    type: 'WAITING_FOR_REPLY',
    title: `💌 ${sender.fullName} is waiting to hear from you`,
    body: 'Open your conversation whenever you have a moment.',
    conversationId,
    messageId,
    email: {
      subject: '💌 Someone is waiting to hear from you',
      title: '💌 Someone is waiting to hear from you',
      bodyHtml: `<p><strong>${escapeHtml(sender.fullName)}</strong> is waiting to hear from you. No rush — just a gentle nudge for whenever you have a moment.</p>`,
      ctaLabel: 'Open Chat',
      ctaUrl: appUrl ? `${appUrl}/chat/${conversationId}` : undefined,
    },
    whatsappSend: (recipient) =>
      sendWaitingReplyMessage({ to: recipient.whatsappNumber, senderName: sender.fullName, appUrl: appUrl ? `${appUrl}/chat/${conversationId}` : '' }),
  });

  return { sent: true };
}

// Runs every ~10-15 minutes (see server.js). Safe against duplicate/overlapping
// execution: every write path re-checks the unique ReminderSent(messageId)
// and the recipient cooldown at the moment of sending, so even if two ticks
// briefly overlap, at most one reminder gets created per eligible message —
// the unique constraint on ReminderSent.messageId is the ultimate guard.
export async function runWaitingReplyScheduler() {
  const conversations = await prisma.conversation.findMany({ select: { id: true } });
  let sent = 0;

  for (const { id: conversationId } of conversations) {
    try {
      const lastMessage = await prisma.message.findFirst({ where: { conversationId }, orderBy: { createdAt: 'desc' } });
      if (!lastMessage) continue;

      const elapsedMs = Date.now() - new Date(lastMessage.createdAt).getTime();
      if (elapsedMs < waitingReplyDelayHours() * 60 * 60 * 1000) continue;

      const alreadyReminded = await prisma.reminderSent.findUnique({ where: { messageId: lastMessage.id } });
      if (alreadyReminded) continue;

      const recipientId = await getOtherMemberId(conversationId, lastMessage.senderId);
      if (!recipientId) continue;

      const result = await sendWaitingReplyReminder({
        conversationId,
        senderId: lastMessage.senderId,
        recipientId,
        messageId: lastMessage.id,
      });
      if (result.sent) sent += 1;
    } catch (err) {
      console.error(`Waiting-reply scheduler failed for conversation ${conversationId}:`, err);
    }
  }

  return sent;
}
