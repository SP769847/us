import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicUser } from '../utils/serializers.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [connections, recentConversations, newLoveNotes, lockedMessages, recentMemories, upcomingDates, unreadNotifications] = await Promise.all([
    prisma.connection.findMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] }, include: { userA: true, userB: true } }),
    prisma.conversationMember.findMany({
      where: { userId },
      include: { conversation: { include: { members: { include: { user: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } } } },
      take: 5,
    }),
    prisma.loveNote.count({ where: { recipientId: userId, kind: 'LOVE_NOTE', createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.secretMessage.count({ where: { recipientId: userId, openedAt: null } }),
    prisma.memory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 4 }),
    prisma.specialDate.findMany({ where: { userId } }),
    prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
  ]);

  const onlineConnections = connections.filter((c) => {
    const peer = c.userAId === userId ? c.userB : c.userA;
    return peer.isOnline;
  }).map((c) => publicUser(c.userAId === userId ? c.userB : c.userA));

  const now = new Date();
  const upcoming = upcomingDates
    .map((sd) => {
      let next = new Date(sd.date);
      if (sd.isRecurringYearly) {
        next = new Date(now.getFullYear(), next.getMonth(), next.getDate());
        if (next < now) next.setFullYear(next.getFullYear() + 1);
      }
      return { ...sd, nextOccurrence: next, daysUntil: Math.ceil((next - now) / 86400000) };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3);

  res.json({
    connectionsCount: connections.length,
    onlineConnections,
    recentConversations: recentConversations.map((m) => {
      const peer = m.conversation.members.find((mem) => mem.userId !== userId)?.user;
      return {
        id: m.conversation.id,
        peer: publicUser(peer),
        lastMessage: m.conversation.messages[0] || null,
      };
    }),
    newLoveNotesCount: newLoveNotes,
    lockedMessagesCount: lockedMessages,
    recentMemories: recentMemories.map((m) => ({ ...m, photos: m.photos ? JSON.parse(m.photos) : [] })),
    upcomingSpecialDates: upcoming,
    unreadNotifications,
  });
});
