import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({
    notifications: notifications.map((n) => ({ ...n, data: n.data ? JSON.parse(n.data) : null })),
  });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await prisma.notification.count({ where: { recipientId: req.user.id, isRead: false } });
  res.json({ count });
});

export const markRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, recipientId: req.user.id },
    data: { isRead: true },
  });
  res.json({ message: 'Marked as read' });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { recipientId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ message: 'All marked as read' });
});
