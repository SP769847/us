import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeText } from '../utils/validators.js';
import { requireMembership, getOtherMemberId } from '../services/chatService.js';
import { createNotification } from '../services/notificationService.js';
import { getIO } from '../sockets/index.js';
import { QUESTION_CATEGORIES } from '../utils/contentBanks.js';
import { MESSAGE_INCLUDE, serializeMessage, serializeSentQuestion } from './messages.controller.js';

const VALID_CATEGORIES = new Set(Object.keys(QUESTION_CATEGORIES));

function isAgeConfirmed(req) {
  return req.headers['x-age-confirmed'] === 'true';
}

export const listCategories = asyncHandler(async (req, res) => {
  const counts = await prisma.question.groupBy({
    by: ['category'],
    where: { active: true },
    _count: { _all: true },
  });
  const countByCategory = Object.fromEntries(counts.map((c) => [c.category, c._count._all]));

  res.json({
    categories: Object.entries(QUESTION_CATEGORIES).map(([key, meta]) => ({
      key,
      label: meta.label,
      emoji: meta.emoji,
      ageRestricted: meta.ageRestricted,
      count: countByCategory[key] || 0,
    })),
  });
});

export const randomQuestion = asyncHandler(async (req, res) => {
  const category = req.query.category ? String(req.query.category).toUpperCase() : null;
  const exclude = req.query.exclude ? String(req.query.exclude).split(',').filter(Boolean) : [];
  const ageConfirmed = isAgeConfirmed(req);

  if (category && !VALID_CATEGORIES.has(category) && category !== 'ANY') {
    throw new ApiError(400, 'Unknown question category');
  }

  if (category === 'NAUGHTY_18' && !ageConfirmed) {
    throw new ApiError(403, 'Please confirm you are 18+ to view these questions');
  }

  const where = { active: true };
  if (category && category !== 'ANY') {
    where.category = category;
  } else if (!ageConfirmed) {
    where.category = { not: 'NAUGHTY_18' };
  }
  if (exclude.length) {
    where.id = { notIn: exclude };
  }

  const count = await prisma.question.count({ where });
  if (count === 0) {
    throw new ApiError(404, 'No more questions in this category right now');
  }
  const skip = Math.floor(Math.random() * count);
  const [question] = await prisma.question.findMany({ where, skip, take: 1 });

  res.json({
    question: {
      id: question.id,
      category: question.category,
      questionText: question.questionText,
      ageRestricted: question.ageRestricted,
    },
  });
});

export const sendQuestion = asyncHandler(async (req, res) => {
  const { conversationId, questionId, customText, mode = 'SURPRISE', answer } = req.body;
  if (!conversationId) throw new ApiError(400, 'conversationId is required');

  await requireMembership(conversationId, req.user.id);
  const recipientId = await getOtherMemberId(conversationId, req.user.id);
  if (!recipientId) throw new ApiError(400, 'This conversation has no other participant');

  const normalizedMode = mode === 'ASK_ME_ANYTHING' ? 'ASK_ME_ANYTHING' : 'SURPRISE';

  let question = null;
  let category = null;
  let text = null;

  if (normalizedMode === 'ASK_ME_ANYTHING') {
    text = sanitizeText(customText, 300);
    if (!text) throw new ApiError(400, 'Write a question to send');
  } else {
    if (questionId) {
      question = await prisma.question.findUnique({ where: { id: questionId } });
      if (!question || !question.active) throw new ApiError(404, 'Question not found');
      category = question.category;
    } else if (customText) {
      text = sanitizeText(customText, 300);
      if (!text) throw new ApiError(400, 'Write a question to send');
    } else {
      throw new ApiError(400, 'questionId or customText is required');
    }

    if (category === 'NAUGHTY_18' && !isAgeConfirmed(req)) {
      throw new ApiError(403, 'Please confirm you are 18+ to send this question');
    }
  }

  let selfAnswer = null;
  if (normalizedMode === 'SURPRISE' && answer) {
    selfAnswer = sanitizeText(answer, 2000);
  }

  const { message, sentQuestion } = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.message.create({
      data: { conversationId, senderId: req.user.id, type: 'QUESTION', content: null },
    });

    const createdSentQuestion = await tx.sentQuestion.create({
      data: {
        questionId: question?.id || null,
        customText: text,
        mode: normalizedMode,
        category: category,
        conversationId,
        messageId: createdMessage.id,
        senderId: req.user.id,
        recipientId,
        revealed: normalizedMode === 'SURPRISE',
        answer: selfAnswer,
        answeredById: selfAnswer ? req.user.id : null,
        answeredAt: selfAnswer ? new Date() : null,
      },
    });

    return { message: createdMessage, sentQuestion: createdSentQuestion };
  });

  const fullMessage = await prisma.message.findUnique({ where: { id: message.id }, include: MESSAGE_INCLUDE });

  const io = getIO();
  if (io) {
    io.to(`user:${req.user.id}`).emit('new-message', serializeMessage(fullMessage, req.user.id));
    io.to(`user:${recipientId}`).emit('new-message', serializeMessage(fullMessage, recipientId));
  }

  await createNotification({
    recipientId,
    type: 'NEW_QUESTION',
    title: normalizedMode === 'ASK_ME_ANYTHING' ? 'Someone has a question for you 👀' : `${req.user.fullName} sent you a surprise question`,
    body: normalizedMode === 'ASK_ME_ANYTHING' ? 'Open your chat to reveal it.' : text || question?.questionText,
    data: { conversationId, messageId: message.id, sentQuestionId: sentQuestion.id },
  });

  res.status(201).json({ message: serializeMessage(fullMessage, req.user.id) });
});

async function loadOwnedSentQuestion(id, userId) {
  const sentQuestion = await prisma.sentQuestion.findUnique({ where: { id }, include: { question: true } });
  if (!sentQuestion) throw new ApiError(404, 'Question not found');
  if (sentQuestion.senderId !== userId && sentQuestion.recipientId !== userId) {
    throw new ApiError(403, 'You do not have access to this question');
  }
  return sentQuestion;
}

export const answerSentQuestion = asyncHandler(async (req, res) => {
  const sentQuestion = await loadOwnedSentQuestion(req.params.id, req.user.id);
  if (sentQuestion.recipientId !== req.user.id) throw new ApiError(403, 'Only the recipient can answer this question');
  if (sentQuestion.answer) throw new ApiError(400, 'This question has already been answered');
  if (sentQuestion.mode === 'ASK_ME_ANYTHING' && !sentQuestion.revealed) {
    throw new ApiError(400, 'Reveal the question before answering');
  }

  const answer = sanitizeText(req.body.answer, 2000);
  if (!answer) throw new ApiError(400, 'Please write an answer');

  const updated = await prisma.sentQuestion.update({
    where: { id: sentQuestion.id },
    data: { answer, answeredAt: new Date(), answeredById: req.user.id },
    include: { question: true },
  });

  const io = getIO();
  if (io) {
    io.to(`conversation:${updated.conversationId}`).emit('question-answered', {
      messageId: updated.messageId,
      sentQuestion: serializeSentQuestion(updated, req.user.id),
    });
  }

  await createNotification({
    recipientId: updated.senderId,
    type: 'QUESTION_ANSWERED',
    title: `${req.user.fullName} answered your question`,
    body: answer.slice(0, 100),
    data: { conversationId: updated.conversationId, messageId: updated.messageId, sentQuestionId: updated.id },
  });

  res.json({ sentQuestion: serializeSentQuestion(updated, req.user.id) });
});

export const revealSentQuestion = asyncHandler(async (req, res) => {
  const sentQuestion = await loadOwnedSentQuestion(req.params.id, req.user.id);
  if (sentQuestion.recipientId !== req.user.id) throw new ApiError(403, 'Only the recipient can reveal this question');

  const updated = sentQuestion.revealed
    ? sentQuestion
    : await prisma.sentQuestion.update({ where: { id: sentQuestion.id }, data: { revealed: true }, include: { question: true } });

  const io = getIO();
  if (io && !sentQuestion.revealed) {
    io.to(`conversation:${updated.conversationId}`).emit('question-revealed', {
      messageId: updated.messageId,
      sentQuestion: serializeSentQuestion(updated, req.user.id),
    });
  }

  res.json({ sentQuestion: serializeSentQuestion(updated, req.user.id) });
});
