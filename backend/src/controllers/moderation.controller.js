import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { publicUser } from '../utils/serializers.js';

const REPORT_REASONS = new Set(['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'FAKE_ACCOUNT', 'OTHER']);

export const blockUser = asyncHandler(async (req, res) => {
  const { username, reason } = req.body;
  const target = await prisma.user.findUnique({ where: { username: (username || '').toLowerCase() } });
  if (!target) throw new ApiError(404, 'User not found');
  if (target.id === req.user.id) throw new ApiError(400, 'You cannot block yourself');

  await prisma.blockedUser.upsert({
    where: { blockerId_blockedId: { blockerId: req.user.id, blockedId: target.id } },
    update: {},
    create: { blockerId: req.user.id, blockedId: target.id, reason: reason ? String(reason).slice(0, 300) : null },
  });

  await prisma.connection.deleteMany({
    where: {
      OR: [
        { userAId: req.user.id, userBId: target.id },
        { userAId: target.id, userBId: req.user.id },
      ],
    },
  });
  await prisma.connectionRequest.deleteMany({
    where: {
      OR: [
        { senderId: req.user.id, recipientId: target.id },
        { senderId: target.id, recipientId: req.user.id },
      ],
    },
  });

  res.json({ message: `${target.fullName} has been blocked` });
});

export const unblockUser = asyncHandler(async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username.toLowerCase() } });
  if (!target) throw new ApiError(404, 'User not found');

  await prisma.blockedUser.deleteMany({ where: { blockerId: req.user.id, blockedId: target.id } });
  res.json({ message: 'User unblocked' });
});

export const listBlockedUsers = asyncHandler(async (req, res) => {
  const blocks = await prisma.blockedUser.findMany({
    where: { blockerId: req.user.id },
    include: { blocked: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ blocked: blocks.map((b) => ({ id: b.id, reason: b.reason, createdAt: b.createdAt, user: publicUser(b.blocked) })) });
});

export const reportUser = asyncHandler(async (req, res) => {
  const { username, reason, details } = req.body;
  if (!REPORT_REASONS.has(reason)) throw new ApiError(400, 'Please select a valid reason');

  const target = await prisma.user.findUnique({ where: { username: (username || '').toLowerCase() } });
  if (!target) throw new ApiError(404, 'User not found');
  if (target.id === req.user.id) throw new ApiError(400, 'You cannot report yourself');

  const report = await prisma.report.create({
    data: {
      reporterId: req.user.id,
      reportedId: target.id,
      reason,
      details: details ? String(details).slice(0, 1000) : null,
    },
  });

  res.status(201).json({ message: 'Report submitted. Our team will review it.', reportId: report.id });
});
