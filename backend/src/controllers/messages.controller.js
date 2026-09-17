import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { publicUser } from '../utils/serializers.js';
import { requireMembership, getOtherMemberId } from '../services/chatService.js';
import { createNotification } from '../services/notificationService.js';
import { getIO } from '../sockets/index.js';
import { sanitizeText } from '../utils/validators.js';

export function serializeSentQuestion(sq, viewerId) {
  if (!sq) return null;
  const needsReveal = sq.mode === 'ASK_ME_ANYTHING' && !sq.revealed && viewerId !== sq.senderId;
  return {
    id: sq.id,
    mode: sq.mode,
    category: sq.category,
    ageRestricted: sq.category === 'NAUGHTY_18',
    questionText: needsReveal ? null : sq.customText || sq.question?.questionText || null,
    needsReveal,
    canReveal: needsReveal && viewerId === sq.recipientId,
    canAnswer: !sq.answer && viewerId === sq.recipientId && !needsReveal,
    answer: sq.answer,
    answeredAt: sq.answeredAt,
    answeredById: sq.answeredById,
    senderId: sq.senderId,
    recipientId: sq.recipientId,
  };
}

function serializeMessage(msg, viewerId) {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    type: msg.type,
    content: msg.isDeleted ? null : msg.content,
    attachmentUrl: msg.isDeleted ? null : msg.attachmentUrl,
    isDeleted: msg.isDeleted,
    replyToId: msg.replyToId,
    replyTo: msg.replyTo
      ? { id: msg.replyTo.id, content: msg.replyTo.isDeleted ? null : msg.replyTo.content, type: msg.replyTo.type, senderId: msg.replyTo.senderId }
      : null,
    createdAt: msg.createdAt,
    readAt: msg.readAt,
    sender: msg.sender ? publicUser(msg.sender) : undefined,
    senderId: msg.senderId,
    reactions: (msg.reactions || []).map((r) => ({ userId: r.userId, emoji: r.emoji })),
    isPinned: Boolean(msg.pins && msg.pins.length),
    sentQuestion: msg.type === 'QUESTION' ? serializeSentQuestion(msg.sentQuestion, viewerId) : undefined,
  };
}

export { serializeMessage };

export const MESSAGE_INCLUDE = {
  sender: true,
  replyTo: true,
  reactions: true,
  pins: true,
  sentQuestion: { include: { question: true } },
};

export const listMessages = asyncHandler(async (req, res) => {
  await requireMembership(req.params.id, req.user.id);

  const take = Math.min(Number(req.query.limit) || 30, 60);
  const before = req.query.before;

  const messages = await prisma.message.findMany({
    where: { conversationId: req.params.id },
    include: MESSAGE_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take,
    ...(before ? { skip: 1, cursor: { id: before } } : {}),
  });

  res.json({
    messages: messages.map((m) => serializeMessage(m, req.user.id)).reverse(),
    nextCursor: messages.length === take ? messages[messages.length - 1].id : null,
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  await requireMembership(req.params.id, req.user.id);

  const content = req.body.content ? sanitizeText(req.body.content, 4000) : null;
  const replyToId = req.body.replyToId || null;
  let type = 'TEXT';
  let attachmentUrl = null;

  if (req.file) {
    type = 'IMAGE';
    attachmentUrl = `/uploads/chat/${req.file.filename}`;
  } else if (req.body.type === 'EMOJI') {
    type = 'EMOJI';
  }

  if (!content && !attachmentUrl) {
    throw new ApiError(400, 'Message cannot be empty');
  }

  if (replyToId) {
    const original = await prisma.message.findUnique({ where: { id: replyToId } });
    if (!original || original.conversationId !== req.params.id) {
      throw new ApiError(400, 'Invalid message to reply to');
    }
  }

  const message = await prisma.message.create({
    data: {
      conversationId: req.params.id,
      senderId: req.user.id,
      type,
      content,
      attachmentUrl,
      replyToId,
    },
    include: MESSAGE_INCLUDE,
  });

  const serialized = serializeMessage(message, req.user.id);

  const io = getIO();
  if (io) {
    io.to(`conversation:${req.params.id}`).emit('new-message', serialized);
  }

  const otherUserId = await getOtherMemberId(req.params.id, req.user.id);
  if (otherUserId) {
    await createNotification({
      recipientId: otherUserId,
      type: 'NEW_MESSAGE',
      title: `New message from ${req.user.fullName}`,
      body: type === 'TEXT' ? content?.slice(0, 100) : 'Sent a photo',
      data: { conversationId: req.params.id, messageId: message.id },
    });
  }

  res.status(201).json({ message: serialized });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await prisma.message.findUnique({ where: { id: req.params.id } });
  if (!message) throw new ApiError(404, 'Message not found');
  await requireMembership(message.conversationId, req.user.id);
  if (message.senderId !== req.user.id) throw new ApiError(403, 'You can only delete your own messages');

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { isDeleted: true, content: null, attachmentUrl: null },
  });

  const io = getIO();
  if (io) {
    io.to(`conversation:${message.conversationId}`).emit('message-deleted', { id: updated.id, conversationId: message.conversationId });
  }

  res.json({ message: 'Message deleted' });
});

const ALLOWED_EMOJI = new Set(['❤️', '😂', '🥰', '😮', '😢', '👍']);

export const toggleReaction = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  if (!ALLOWED_EMOJI.has(emoji)) throw new ApiError(400, 'Unsupported reaction');

  const message = await prisma.message.findUnique({ where: { id: req.params.id } });
  if (!message) throw new ApiError(404, 'Message not found');
  await requireMembership(message.conversationId, req.user.id);

  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId: message.id, userId: req.user.id, emoji } },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.create({ data: { messageId: message.id, userId: req.user.id, emoji } });
  }

  const reactions = await prisma.messageReaction.findMany({ where: { messageId: message.id } });

  const io = getIO();
  if (io) {
    io.to(`conversation:${message.conversationId}`).emit('message-reaction', {
      messageId: message.id,
      reactions: reactions.map((r) => ({ userId: r.userId, emoji: r.emoji })),
    });
  }

  res.json({ reactions: reactions.map((r) => ({ userId: r.userId, emoji: r.emoji })) });
});

export const togglePin = asyncHandler(async (req, res) => {
  const message = await prisma.message.findUnique({ where: { id: req.params.id } });
  if (!message) throw new ApiError(404, 'Message not found');
  await requireMembership(message.conversationId, req.user.id);

  const existing = await prisma.messagePin.findUnique({ where: { messageId: message.id } });

  let pinned;
  if (existing) {
    await prisma.messagePin.delete({ where: { id: existing.id } });
    pinned = false;
  } else {
    await prisma.messagePin.create({ data: { messageId: message.id, pinnedById: req.user.id } });
    pinned = true;
  }

  const io = getIO();
  if (io) {
    io.to(`conversation:${message.conversationId}`).emit('message-pin-changed', { messageId: message.id, pinned });
  }

  res.json({ pinned });
});
