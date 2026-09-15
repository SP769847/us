import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { publicUser } from '../utils/serializers.js';
import { areConnected } from '../services/connectionService.js';
import { createNotification } from '../services/notificationService.js';
import { sanitizeText } from '../utils/validators.js';

export const createSecretMessage = asyncHandler(async (req, res) => {
  const { recipientUsername, content, unlockAt, passcode } = req.body;
  const recipient = await prisma.user.findUnique({ where: { username: (recipientUsername || '').toLowerCase() } });
  if (!recipient) throw new ApiError(404, 'Recipient not found');
  if (!(await areConnected(req.user.id, recipient.id))) {
    throw new ApiError(403, 'You can only send secret messages to your connections');
  }
  if (!content) throw new ApiError(400, 'Message content is required');

  const passcodeHash = passcode ? await bcrypt.hash(String(passcode), 10) : null;

  const secret = await prisma.secretMessage.create({
    data: {
      senderId: req.user.id,
      recipientId: recipient.id,
      content: sanitizeText(content, 3000),
      passcodeHash,
      unlockAt: unlockAt ? new Date(unlockAt) : null,
    },
  });

  await createNotification({
    recipientId: recipient.id,
    type: 'NEW_SECRET_MESSAGE',
    title: 'You have a secret message 🔐',
    body: 'There\'s something written just for you...',
    data: { secretId: secret.id },
  });

  res.status(201).json({ secret: { id: secret.id, createdAt: secret.createdAt } });
});

function serializeLocked(secret, viewerId) {
  const isRecipient = secret.recipientId === viewerId;
  const timeLocked = secret.unlockAt && new Date(secret.unlockAt) > new Date();
  const passcodeLocked = Boolean(secret.passcodeHash);
  const opened = Boolean(secret.openedAt);

  return {
    id: secret.id,
    createdAt: secret.createdAt,
    sender: publicUser(secret.sender),
    recipient: publicUser(secret.recipient),
    direction: isRecipient ? 'RECEIVED' : 'SENT',
    unlockAt: secret.unlockAt,
    requiresPasscode: passcodeLocked,
    isTimeLocked: isRecipient && timeLocked,
    opened,
    content: !isRecipient || opened ? secret.content : null,
  };
}

export const listSecretMessages = asyncHandler(async (req, res) => {
  const secrets = await prisma.secretMessage.findMany({
    where: { OR: [{ senderId: req.user.id }, { recipientId: req.user.id }] },
    include: { sender: true, recipient: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ secrets: secrets.map((s) => serializeLocked(s, req.user.id)) });
});

export const unlockSecretMessage = asyncHandler(async (req, res) => {
  const secret = await prisma.secretMessage.findUnique({
    where: { id: req.params.id },
    include: { sender: true, recipient: true },
  });
  if (!secret || (secret.senderId !== req.user.id && secret.recipientId !== req.user.id)) {
    throw new ApiError(404, 'Message not found');
  }

  if (secret.recipientId === req.user.id) {
    if (secret.unlockAt && new Date(secret.unlockAt) > new Date()) {
      throw new ApiError(403, 'This message is not unlockable yet');
    }
    if (secret.passcodeHash) {
      const { passcode } = req.body;
      const valid = passcode && (await bcrypt.compare(String(passcode), secret.passcodeHash));
      if (!valid) throw new ApiError(401, 'Incorrect passcode');
    }
    if (!secret.openedAt) {
      await prisma.secretMessage.update({ where: { id: secret.id }, data: { openedAt: new Date() } });
    }
  }

  const fresh = await prisma.secretMessage.findUnique({
    where: { id: secret.id },
    include: { sender: true, recipient: true },
  });
  res.json({ secret: serializeLocked(fresh, req.user.id) });
});
