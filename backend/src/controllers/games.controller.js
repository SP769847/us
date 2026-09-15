import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { publicUser } from '../utils/serializers.js';
import {
  THIS_OR_THAT,
  WOULD_YOU_RATHER,
  TRUTH_OR_DARE,
  WHO_KNOWS_ME_BETTER,
  pickRandom,
} from '../utils/contentBanks.js';
import { createNotification } from '../services/notificationService.js';

const GAME_TYPES = new Set(['THIS_OR_THAT', 'WOULD_YOU_RATHER', 'TRUTH_OR_DARE', 'WHO_KNOWS_ME_BETTER']);

async function requireConnectionMember(connectionId, userId) {
  const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!connection || (connection.userAId !== userId && connection.userBId !== userId)) {
    throw new ApiError(403, 'You are not part of this connection');
  }
  return connection;
}

function buildPayload(gameType, subjectId) {
  switch (gameType) {
    case 'THIS_OR_THAT':
      return { prompt: pickRandom(THIS_OR_THAT), answers: {} };
    case 'WOULD_YOU_RATHER':
      return { prompt: pickRandom(WOULD_YOU_RATHER), answers: {} };
    case 'TRUTH_OR_DARE':
      return { prompt: pickRandom(TRUTH_OR_DARE), answers: {} };
    case 'WHO_KNOWS_ME_BETTER':
      return { question: pickRandom(WHO_KNOWS_ME_BETTER), subjectId, answers: {} };
    default:
      throw new ApiError(400, 'Unknown game type');
  }
}

function serializeSession(session, viewerId) {
  const payload = JSON.parse(session.payload);
  const answerCount = Object.keys(payload.answers || {}).length;
  const bothAnswered = answerCount >= 2;

  return {
    id: session.id,
    gameType: session.gameType,
    status: session.status,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    initiator: publicUser(session.initiator),
    prompt: payload.prompt || null,
    question: payload.question || null,
    subjectId: payload.subjectId || null,
    myAnswer: payload.answers?.[viewerId] ?? null,
    revealed: bothAnswered,
    answers: bothAnswered ? payload.answers : undefined,
  };
}

export const startGame = asyncHandler(async (req, res) => {
  const { connectionId, gameType } = req.body;
  if (!GAME_TYPES.has(gameType)) throw new ApiError(400, 'Unknown game type');

  const connection = await requireConnectionMember(connectionId, req.user.id);
  const payload = buildPayload(gameType, req.user.id);

  const session = await prisma.gameSession.create({
    data: {
      initiatorId: req.user.id,
      connectionId,
      gameType,
      payload: JSON.stringify(payload),
    },
    include: { initiator: true },
  });

  const otherUserId = connection.userAId === req.user.id ? connection.userBId : connection.userAId;
  await createNotification({
    recipientId: otherUserId,
    type: 'GAME_INVITE',
    title: `${req.user.fullName} started a game 🎲`,
    body: gameType.replace(/_/g, ' ').toLowerCase(),
    data: { gameSessionId: session.id },
  });

  res.status(201).json({ session: serializeSession(session, req.user.id) });
});

export const listGames = asyncHandler(async (req, res) => {
  const { connectionId } = req.query;
  if (!connectionId) throw new ApiError(400, 'connectionId is required');
  await requireConnectionMember(connectionId, req.user.id);

  const sessions = await prisma.gameSession.findMany({
    where: { connectionId },
    include: { initiator: true },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  res.json({ sessions: sessions.map((s) => serializeSession(s, req.user.id)) });
});

export const getGame = asyncHandler(async (req, res) => {
  const session = await prisma.gameSession.findUnique({ where: { id: req.params.id }, include: { initiator: true } });
  if (!session) throw new ApiError(404, 'Game not found');
  await requireConnectionMember(session.connectionId, req.user.id);
  res.json({ session: serializeSession(session, req.user.id) });
});

export const answerGame = asyncHandler(async (req, res) => {
  const { answer } = req.body;
  if (answer === undefined || answer === null || answer === '') {
    throw new ApiError(400, 'Answer is required');
  }

  const session = await prisma.gameSession.findUnique({ where: { id: req.params.id } });
  if (!session) throw new ApiError(404, 'Game not found');
  await requireConnectionMember(session.connectionId, req.user.id);

  const payload = JSON.parse(session.payload);
  payload.answers = payload.answers || {};
  payload.answers[req.user.id] = String(answer).slice(0, 500);

  const bothAnswered = Object.keys(payload.answers).length >= 2;

  const updated = await prisma.gameSession.update({
    where: { id: session.id },
    data: {
      payload: JSON.stringify(payload),
      status: bothAnswered ? 'COMPLETED' : 'ACTIVE',
      completedAt: bothAnswered ? new Date() : null,
    },
    include: { initiator: true },
  });

  res.json({ session: serializeSession(updated, req.user.id) });
});
