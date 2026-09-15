import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { publicUser } from '../utils/serializers.js';
import { requireMembership, getOtherMemberId } from '../services/chatService.js';

export const listConversations = asyncHandler(async (req, res) => {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId: req.user.id },
    include: {
      conversation: {
        include: {
          members: { include: { user: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
  });

  const results = await Promise.all(
    memberships.map(async (m) => {
      const conversation = m.conversation;
      const otherMember = conversation.members.find((mem) => mem.userId !== req.user.id);
      const lastMessage = conversation.messages[0] || null;

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: req.user.id },
          isDeleted: false,
          createdAt: { gt: m.lastReadAt || new Date(0) },
        },
      });

      return {
        id: conversation.id,
        peer: publicUser(otherMember?.user),
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              type: lastMessage.type,
              content: lastMessage.isDeleted ? null : lastMessage.content,
              isDeleted: lastMessage.isDeleted,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
        updatedAt: lastMessage?.createdAt || conversation.createdAt,
      };
    })
  );

  results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ conversations: results });
});

export const getConversation = asyncHandler(async (req, res) => {
  await requireMembership(req.params.id, req.user.id);
  const otherUserId = await getOtherMemberId(req.params.id, req.user.id);
  const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
  res.json({ conversation: { id: req.params.id, peer: publicUser(otherUser) } });
});

export const markConversationRead = asyncHandler(async (req, res) => {
  await requireMembership(req.params.id, req.user.id);
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: req.params.id, userId: req.user.id } },
    data: { lastReadAt: new Date() },
  });

  await prisma.message.updateMany({
    where: { conversationId: req.params.id, senderId: { not: req.user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  res.json({ message: 'Marked as read' });
});

export const searchConversationMessages = asyncHandler(async (req, res) => {
  await requireMembership(req.params.id, req.user.id);
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ messages: [] });

  const messages = await prisma.message.findMany({
    where: {
      conversationId: req.params.id,
      isDeleted: false,
      type: 'TEXT',
      content: { contains: q, mode: 'insensitive' },
    },
    include: { sender: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({
    messages: messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt,
      sender: publicUser(msg.sender),
    })),
  });
});

export const listPinnedMessages = asyncHandler(async (req, res) => {
  await requireMembership(req.params.id, req.user.id);
  const pins = await prisma.messagePin.findMany({
    where: { message: { conversationId: req.params.id } },
    include: { message: { include: { sender: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    pinned: pins.map((p) => ({
      pinId: p.id,
      pinnedAt: p.createdAt,
      message: {
        id: p.message.id,
        content: p.message.content,
        type: p.message.type,
        attachmentUrl: p.message.attachmentUrl,
        createdAt: p.message.createdAt,
        sender: publicUser(p.message.sender),
      },
    })),
  });
});
