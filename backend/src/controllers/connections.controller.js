import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { publicUser } from '../utils/serializers.js';
import { isBlockedEitherWay, findConnectionBetween } from '../services/connectionService.js';
import { createNotification } from '../services/notificationService.js';
import { sendConnectionRequestMessage } from '../services/notifications/whatsappProvider.js';
import { escapeHtml } from '../utils/html.js';

export const sendRequest = asyncHandler(async (req, res) => {
  const { recipientUsername, message } = req.body;
  if (!recipientUsername) throw new ApiError(400, 'Recipient is required');

  const recipient = await prisma.user.findUnique({ where: { username: recipientUsername.toLowerCase() } });
  if (!recipient || recipient.status !== 'ACTIVE') throw new ApiError(404, 'User not found');
  if (recipient.id === req.user.id) throw new ApiError(400, 'You cannot connect with yourself');

  if (await isBlockedEitherWay(req.user.id, recipient.id)) {
    throw new ApiError(403, 'You cannot send a request to this user');
  }
  if (await findConnectionBetween(req.user.id, recipient.id)) {
    throw new ApiError(409, 'You are already connected with this user');
  }

  const reverseRequest = await prisma.connectionRequest.findUnique({
    where: { senderId_recipientId: { senderId: recipient.id, recipientId: req.user.id } },
  });
  if (reverseRequest && reverseRequest.status === 'PENDING') {
    throw new ApiError(409, 'This user already sent you a request — check your pending requests');
  }

  const existing = await prisma.connectionRequest.findUnique({
    where: { senderId_recipientId: { senderId: req.user.id, recipientId: recipient.id } },
  });
  if (existing && existing.status === 'PENDING') {
    throw new ApiError(409, 'Connection request already sent');
  }

  const request = existing
    ? await prisma.connectionRequest.update({
        where: { id: existing.id },
        data: { status: 'PENDING', message: message ? String(message).slice(0, 300) : null },
      })
    : await prisma.connectionRequest.create({
        data: {
          senderId: req.user.id,
          recipientId: recipient.id,
          message: message ? String(message).slice(0, 300) : null,
        },
      });

  const appUrl = process.env.APP_URL || '';
  await createNotification({
    recipientId: recipient.id,
    senderId: req.user.id,
    type: 'CONNECTION_REQUEST',
    title: 'Someone wants to connect with you',
    body: `${req.user.fullName} sent you a connection request`,
    data: { requestId: request.id, senderUsername: req.user.username },
    email: {
      subject: '❤️ Someone wants to connect with you',
      title: '❤️ New connection request',
      bodyHtml: `<p><strong>${escapeHtml(req.user.fullName)}</strong> sent you a connection request. Open the app to respond.</p>`,
      ctaLabel: 'Open App',
      ctaUrl: appUrl ? `${appUrl}/connections` : undefined,
    },
    whatsappSend: (recipientUser) =>
      sendConnectionRequestMessage({ to: recipientUser.whatsappNumber, senderName: req.user.fullName, appUrl: appUrl ? `${appUrl}/connections` : '' }),
  });

  res.status(201).json({ request });
});

export const listPendingRequests = asyncHandler(async (req, res) => {
  const [received, sent] = await Promise.all([
    prisma.connectionRequest.findMany({
      where: { recipientId: req.user.id, status: 'PENDING' },
      include: { sender: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.connectionRequest.findMany({
      where: { senderId: req.user.id, status: 'PENDING' },
      include: { recipient: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  res.json({
    received: received.map((r) => ({ id: r.id, message: r.message, createdAt: r.createdAt, sender: publicUser(r.sender) })),
    sent: sent.map((r) => ({ id: r.id, message: r.message, createdAt: r.createdAt, recipient: publicUser(r.recipient) })),
  });
});

export const respondToRequest = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'accept' | 'decline'
  const request = await prisma.connectionRequest.findUnique({ where: { id: req.params.id } });

  if (!request || request.recipientId !== req.user.id) {
    throw new ApiError(404, 'Request not found');
  }
  if (request.status !== 'PENDING') {
    throw new ApiError(409, 'This request has already been handled');
  }

  if (action === 'decline') {
    await prisma.connectionRequest.update({ where: { id: request.id }, data: { status: 'DECLINED' } });
    return res.json({ message: 'Request declined' });
  }

  if (action !== 'accept') throw new ApiError(400, 'Invalid action');

  const [userAId, userBId] = [request.senderId, request.recipientId].sort();

  const result = await prisma.$transaction(async (tx) => {
    await tx.connectionRequest.update({ where: { id: request.id }, data: { status: 'ACCEPTED' } });
    const connection = await tx.connection.create({ data: { userAId, userBId } });
    const conversation = await tx.conversation.create({ data: { connectionId: connection.id } });
    await tx.conversationMember.createMany({
      data: [
        { conversationId: conversation.id, userId: userAId },
        { conversationId: conversation.id, userId: userBId },
      ],
    });
    return { connection, conversation };
  });

  await createNotification({
    recipientId: request.senderId,
    type: 'CONNECTION_ACCEPTED',
    title: 'Connection accepted',
    body: `${req.user.fullName} accepted your connection request`,
    data: { userId: req.user.id, username: req.user.username },
  });

  res.json({ message: 'Connection accepted', connection: result.connection, conversationId: result.conversation.id });
});

export const cancelRequest = asyncHandler(async (req, res) => {
  const request = await prisma.connectionRequest.findUnique({ where: { id: req.params.id } });
  if (!request || request.senderId !== req.user.id) throw new ApiError(404, 'Request not found');
  await prisma.connectionRequest.delete({ where: { id: request.id } });
  res.json({ message: 'Request cancelled' });
});

export const listConnections = asyncHandler(async (req, res) => {
  const connections = await prisma.connection.findMany({
    where: { OR: [{ userAId: req.user.id }, { userBId: req.user.id }] },
    include: { userA: true, userB: true, conversation: true },
    orderBy: { createdAt: 'desc' },
  });

  const results = connections.map((c) => {
    const peer = c.userAId === req.user.id ? c.userB : c.userA;
    return {
      id: c.id,
      connectedAt: c.createdAt,
      conversationId: c.conversation?.id || null,
      user: publicUser(peer),
    };
  });

  res.json({ connections: results });
});

export const removeConnection = asyncHandler(async (req, res) => {
  const connection = await prisma.connection.findUnique({ where: { id: req.params.id } });
  if (!connection || (connection.userAId !== req.user.id && connection.userBId !== req.user.id)) {
    throw new ApiError(404, 'Connection not found');
  }
  await prisma.connection.delete({ where: { id: connection.id } });
  res.json({ message: 'Connection removed' });
});
