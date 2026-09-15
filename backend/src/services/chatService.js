import prisma from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export async function requireMembership(conversationId, userId) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) {
    throw new ApiError(403, 'You do not have access to this conversation');
  }
  return membership;
}

export async function getOtherMemberId(conversationId, userId) {
  const member = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: { not: userId } },
  });
  return member?.userId || null;
}
