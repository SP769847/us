import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { publicUser } from '../utils/serializers.js';
import { CHALLENGES, pickRandom } from '../utils/contentBanks.js';
import { areConnected } from '../services/connectionService.js';
import { createNotification } from '../services/notificationService.js';
import { sanitizeText } from '../utils/validators.js';

export const getRandomChallenge = asyncHandler(async (req, res) => {
  res.json({ prompt: pickRandom(CHALLENGES) });
});

export const sendChallenge = asyncHandler(async (req, res) => {
  const { recipientUsername, prompt } = req.body;
  const recipient = await prisma.user.findUnique({ where: { username: (recipientUsername || '').toLowerCase() } });
  if (!recipient) throw new ApiError(404, 'Recipient not found');
  if (!(await areConnected(req.user.id, recipient.id))) {
    throw new ApiError(403, 'You can only send challenges to your connections');
  }

  const challenge = await prisma.challenge.create({
    data: {
      senderId: req.user.id,
      recipientId: recipient.id,
      prompt: sanitizeText(prompt, 300) || pickRandom(CHALLENGES),
    },
  });

  await createNotification({
    recipientId: recipient.id,
    type: 'CHALLENGE_RECEIVED',
    title: 'You received a challenge 🔥',
    body: challenge.prompt,
    data: { challengeId: challenge.id },
  });

  res.status(201).json({ challenge });
});

export const listChallenges = asyncHandler(async (req, res) => {
  const challenges = await prisma.challenge.findMany({
    where: { OR: [{ senderId: req.user.id }, { recipientId: req.user.id }] },
    include: { sender: true, recipient: true, responses: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    challenges: challenges.map((c) => ({
      id: c.id,
      prompt: c.prompt,
      status: c.status,
      createdAt: c.createdAt,
      sender: publicUser(c.sender),
      recipient: publicUser(c.recipient),
      responses: c.responses.map((r) => ({ id: r.id, response: r.response, createdAt: r.createdAt, user: publicUser(r.user) })),
    })),
  });
});

export const respondToChallenge = asyncHandler(async (req, res) => {
  const { response, status } = req.body;
  const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
  if (!challenge || (challenge.senderId !== req.user.id && challenge.recipientId !== req.user.id)) {
    throw new ApiError(404, 'Challenge not found');
  }

  if (response) {
    await prisma.challengeResponse.create({
      data: { challengeId: challenge.id, userId: req.user.id, response: sanitizeText(response, 2000) },
    });
  }

  if (status && ['ACCEPTED', 'COMPLETED', 'DECLINED'].includes(status)) {
    await prisma.challenge.update({ where: { id: challenge.id }, data: { status } });
  }

  res.json({ message: 'Response saved' });
});
