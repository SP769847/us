import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { publicUser, privateUser } from '../utils/serializers.js';
import { sanitizeText, isStrongPassword } from '../utils/validators.js';
import { findConnectionBetween, isBlockedEitherWay } from '../services/connectionService.js';
import { fileUrl } from '../utils/upload.js';
import { isWhatsAppConfigured, sendOtpMessage } from '../services/notifications/whatsappProvider.js';

const PHONE_RE = /^\+[1-9]\d{6,14}$/; // E.164, e.g. +919876543210

export const discoverUsers = asyncHandler(async (req, res) => {
  const q = sanitizeText(req.query.q || '', 50);
  const take = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = req.query.cursor;

  const blockedByMe = await prisma.blockedUser.findMany({ where: { blockerId: req.user.id }, select: { blockedId: true } });
  const blockedMe = await prisma.blockedUser.findMany({ where: { blockedId: req.user.id }, select: { blockerId: true } });
  const excludeIds = new Set([
    req.user.id,
    ...blockedByMe.map((b) => b.blockedId),
    ...blockedMe.map((b) => b.blockerId),
  ]);

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(excludeIds) },
      status: 'ACTIVE',
      ...(q
        ? {
            OR: [
              { username: { contains: q } },
              { fullName: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const userIds = users.map((u) => u.id);
  const [requestsSent, requestsReceived, connections] = await Promise.all([
    prisma.connectionRequest.findMany({ where: { senderId: req.user.id, recipientId: { in: userIds } } }),
    prisma.connectionRequest.findMany({ where: { recipientId: req.user.id, senderId: { in: userIds } } }),
    prisma.connection.findMany({
      where: {
        OR: [
          { userAId: req.user.id, userBId: { in: userIds } },
          { userBId: req.user.id, userAId: { in: userIds } },
        ],
      },
    }),
  ]);

  const connectedIds = new Set(connections.map((c) => (c.userAId === req.user.id ? c.userBId : c.userAId)));
  const sentMap = new Map(requestsSent.map((r) => [r.recipientId, r]));
  const receivedMap = new Map(requestsReceived.map((r) => [r.senderId, r]));

  const results = users.map((u) => {
    let connectionStatus = 'NONE';
    if (connectedIds.has(u.id)) connectionStatus = 'CONNECTED';
    else if (sentMap.has(u.id)) connectionStatus = `PENDING_SENT`;
    else if (receivedMap.has(u.id)) connectionStatus = 'PENDING_RECEIVED';

    return { ...publicUser(u), connectionStatus };
  });

  res.json({
    users: results,
    nextCursor: users.length === take ? users[users.length - 1].id : null,
  });
});

export const getUserByUsername = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username.toLowerCase() } });
  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(404, 'User not found');
  }

  const blocked = await isBlockedEitherWay(req.user.id, user.id);
  if (blocked && user.id !== req.user.id) {
    throw new ApiError(404, 'User not found');
  }

  const connection = await findConnectionBetween(req.user.id, user.id);
  let connectionStatus = 'NONE';
  if (user.id === req.user.id) connectionStatus = 'SELF';
  else if (connection) connectionStatus = 'CONNECTED';
  else {
    const sent = await prisma.connectionRequest.findUnique({
      where: { senderId_recipientId: { senderId: req.user.id, recipientId: user.id } },
    }).catch(() => null);
    const received = await prisma.connectionRequest.findUnique({
      where: { senderId_recipientId: { senderId: user.id, recipientId: req.user.id } },
    }).catch(() => null);
    if (sent && sent.status === 'PENDING') connectionStatus = 'PENDING_SENT';
    else if (received && received.status === 'PENDING') connectionStatus = 'PENDING_RECEIVED';
  }

  res.json({ user: { ...publicUser(user), connectionStatus } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = {};
  if (req.body.fullName !== undefined) data.fullName = sanitizeText(req.body.fullName, 100);
  if (req.body.bio !== undefined) data.bio = sanitizeText(req.body.bio, 300);
  if (req.file) data.avatarUrl = fileUrl(req.file, 'avatars');

  if (data.fullName === '') throw new ApiError(400, 'Full name cannot be empty');

  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ user: privateUser(user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, 'All fields are required');
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, 'New passwords do not match');
  }
  if (!isStrongPassword(newPassword)) {
    throw new ApiError(400, 'Password must be at least 8 characters and include a letter and a number');
  }

  const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
  if (!valid) throw new ApiError(401, 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
  res.json({ message: 'Password updated successfully' });
});

// WhatsApp opt-in requires verifying the number before notifications can be
// enabled — never send unsolicited WhatsApp messages, per the platform's
// policies and this app's own consent requirement.
export const sendWhatsappOtp = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber || !PHONE_RE.test(phoneNumber)) {
    throw new ApiError(400, 'Enter a valid phone number in international format, e.g. +919876543210');
  }
  if (!isWhatsAppConfigured()) {
    throw new ApiError(503, 'WhatsApp notifications are not available yet. Please try again later.');
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(code, 10);

  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      whatsappNumber: phoneNumber,
      whatsappVerified: false,
      whatsappOtpHash: otpHash,
      whatsappOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const result = await sendOtpMessage({ to: phoneNumber, code });
  if (!result.success) {
    throw new ApiError(502, 'Could not send the verification code right now. Please try again.');
  }

  res.json({ message: 'Verification code sent' });
});

export const verifyWhatsappOtp = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new ApiError(400, 'Enter the verification code');

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user.whatsappOtpHash || !user.whatsappOtpExpiresAt || user.whatsappOtpExpiresAt < new Date()) {
    throw new ApiError(400, 'Your verification code has expired. Please request a new one.');
  }

  const valid = await bcrypt.compare(String(code), user.whatsappOtpHash);
  if (!valid) throw new ApiError(400, 'Incorrect verification code');

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { whatsappVerified: true, whatsappOtpHash: null, whatsappOtpExpiresAt: null },
  });

  res.json({ user: privateUser(updated) });
});

export const disableWhatsapp = asyncHandler(async (req, res) => {
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { whatsappNumber: null, whatsappVerified: false, whatsappOtpHash: null, whatsappOtpExpiresAt: null },
  });
  res.json({ user: privateUser(updated) });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new ApiError(400, 'Please confirm your password to delete your account');

  const valid = await bcrypt.compare(password, req.user.passwordHash);
  if (!valid) throw new ApiError(401, 'Incorrect password');

  await prisma.user.delete({ where: { id: req.user.id } });
  res.clearCookie('token');
  res.json({ message: 'Account deleted' });
});
