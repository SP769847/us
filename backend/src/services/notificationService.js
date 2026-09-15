import prisma from '../config/prisma.js';
import { getIO } from '../sockets/index.js';

export async function createNotification({ recipientId, type, title, body, data }) {
  const notification = await prisma.notification.create({
    data: {
      recipientId,
      type,
      title,
      body: body || null,
      data: data ? JSON.stringify(data) : null,
    },
  });

  const io = getIO();
  if (io) {
    io.to(`user:${recipientId}`).emit('notification', {
      ...notification,
      data: data || null,
    });
  }

  return notification;
}
