import prisma from '../config/prisma.js';

export async function findConnectionBetween(userIdA, userIdB) {
  return prisma.connection.findFirst({
    where: {
      OR: [
        { userAId: userIdA, userBId: userIdB },
        { userAId: userIdB, userBId: userIdA },
      ],
    },
  });
}

export async function areConnected(userIdA, userIdB) {
  const connection = await findConnectionBetween(userIdA, userIdB);
  return Boolean(connection);
}

export async function isBlockedEitherWay(userIdA, userIdB) {
  const block = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });
  return Boolean(block);
}

export async function getConnectionIds(userId) {
  const connections = await prisma.connection.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
  });
  return connections.map((c) => (c.userAId === userId ? c.userBId : c.userAId));
}
