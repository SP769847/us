import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeText } from '../utils/validators.js';
import { requireMembership, getOtherMemberId } from '../services/chatService.js';
import { createNotification } from '../services/notificationService.js';
import { getIO } from '../sockets/index.js';
import {
  QUESTION_CATEGORIES,
  NAUGHTY_SUBCATEGORIES,
  INTIMACY_LEVELS,
  CONTENT_LEVELS,
  LEVEL_CATEGORY_POOLS,
} from '../utils/contentBanks.js';
import { MESSAGE_INCLUDE, serializeMessage, serializeSentQuestion } from './messages.controller.js';

const VALID_CATEGORIES = new Set(Object.keys(QUESTION_CATEGORIES));
const VALID_SUBCATEGORIES = new Set(Object.keys(NAUGHTY_SUBCATEGORIES));
const VALID_INTIMACY_LEVELS = new Set(Object.keys(INTIMACY_LEVELS));
const VALID_LEVELS = new Set(Object.keys(CONTENT_LEVELS));
const VALID_MODES = new Set(['SURPRISE', 'ASK_ME_ANYTHING', 'ANSWER_TOGETHER']);

function isAgeConfirmed(req) {
  return req.headers['x-age-confirmed'] === 'true';
}

function validateAnswerForType(rawAnswer, responseType, options) {
  if (responseType === 'SCALE_1_10') {
    const num = Number(rawAnswer);
    if (!Number.isInteger(num) || num < 1 || num > 10) {
      throw new ApiError(400, 'Please choose a number from 1 to 10');
    }
    return String(num);
  }
  if (responseType === 'YES_NO') {
    const val = String(rawAnswer || '').trim();
    if (val !== 'Yes' && val !== 'No') throw new ApiError(400, 'Please choose Yes or No');
    return val;
  }
  if (responseType === 'MULTIPLE_CHOICE') {
    const val = String(rawAnswer || '').trim();
    let opts = [];
    try {
      opts = options ? JSON.parse(options) : [];
    } catch {
      opts = [];
    }
    if (!opts.includes(val)) throw new ApiError(400, 'Please choose one of the listed options');
    return val;
  }
  const text = sanitizeText(rawAnswer, 2000);
  if (!text) throw new ApiError(400, 'Please write an answer');
  return text;
}

// Builds the Prisma `where` clause deciding which questions are eligible.
// - Explicit category (+ optional subcategory/intimacyLevel): browsing a
//   specific chip — preference has no effect here, only the 18+ age gate does.
// - No category ("Surprise Me"): draws from the pool unlocked by the user's
//   saved content-level preference, further capped by the age gate.
function buildEligibilityWhere({ category, subcategory, intimacyLevel, ageConfirmed, level }) {
  const where = { active: true };

  if (category && category !== 'ANY') {
    where.category = category;
    if (category === 'NAUGHTY_18') {
      if (subcategory) where.subcategory = subcategory;
      if (intimacyLevel) where.intimacyLevel = intimacyLevel;
    }
    return where;
  }

  const pool = LEVEL_CATEGORY_POOLS[level] || LEVEL_CATEGORY_POOLS.ROMANTIC;
  const nonNaughty = pool.categories.filter((c) => c !== 'NAUGHTY_18');
  const naughtyUnlocked = ageConfirmed && pool.categories.includes('NAUGHTY_18') && pool.naughtySubcategories.length > 0;

  if (naughtyUnlocked) {
    where.OR = [{ category: { in: nonNaughty } }, { category: 'NAUGHTY_18', subcategory: { in: pool.naughtySubcategories } }];
  } else {
    where.category = { in: nonNaughty };
  }
  return where;
}

export const listCategories = asyncHandler(async (req, res) => {
  const counts = await prisma.question.groupBy({ by: ['category'], where: { active: true }, _count: { _all: true } });
  const countByCategory = Object.fromEntries(counts.map((c) => [c.category, c._count._all]));

  const subCounts = await prisma.question.groupBy({
    by: ['subcategory'],
    where: { active: true, category: 'NAUGHTY_18', subcategory: { not: null } },
    _count: { _all: true },
  });
  const countBySubcategory = Object.fromEntries(subCounts.map((c) => [c.subcategory, c._count._all]));

  res.json({
    categories: Object.entries(QUESTION_CATEGORIES).map(([key, meta]) => ({
      key,
      label: meta.label,
      emoji: meta.emoji,
      ageRestricted: meta.ageRestricted,
      count: countByCategory[key] || 0,
    })),
    naughtySubcategories: Object.entries(NAUGHTY_SUBCATEGORIES).map(([key, meta]) => ({
      key,
      label: meta.label,
      emoji: meta.emoji,
      count: countBySubcategory[key] || 0,
    })),
    intimacyLevels: Object.entries(INTIMACY_LEVELS).map(([key, meta]) => ({ key, label: meta.label, emoji: meta.emoji, order: meta.order })),
    contentLevels: Object.entries(CONTENT_LEVELS).map(([key, meta]) => ({ key, label: meta.label, emoji: meta.emoji })),
  });
});

export const getPreferences = asyncHandler(async (req, res) => {
  res.json({ level: req.user.questionPreference || 'ROMANTIC' });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const { level } = req.body;
  if (!VALID_LEVELS.has(level)) throw new ApiError(400, 'Unknown content level');
  if (level !== 'CUTE' && level !== 'ROMANTIC' && !isAgeConfirmed(req)) {
    throw new ApiError(403, 'Please confirm you are 18+ to select this content level');
  }
  await prisma.user.update({ where: { id: req.user.id }, data: { questionPreference: level } });
  res.json({ level });
});

export const randomQuestion = asyncHandler(async (req, res) => {
  const category = req.query.category ? String(req.query.category).toUpperCase() : null;
  const subcategory = req.query.subcategory ? String(req.query.subcategory).toUpperCase() : null;
  const intimacyLevel = req.query.intimacyLevel ? String(req.query.intimacyLevel).toUpperCase() : null;
  const clientExclude = req.query.exclude ? String(req.query.exclude).split(',').filter(Boolean) : [];
  const ageConfirmed = isAgeConfirmed(req);

  if (category && category !== 'ANY' && !VALID_CATEGORIES.has(category)) {
    throw new ApiError(400, 'Unknown question category');
  }
  if (subcategory && !VALID_SUBCATEGORIES.has(subcategory)) {
    throw new ApiError(400, 'Unknown question subcategory');
  }
  if (intimacyLevel && !VALID_INTIMACY_LEVELS.has(intimacyLevel)) {
    throw new ApiError(400, 'Unknown intimacy level');
  }
  if (category === 'NAUGHTY_18' && !ageConfirmed) {
    throw new ApiError(403, 'Please confirm you are 18+ to view these questions');
  }

  const baseWhere = buildEligibilityWhere({ category, subcategory, intimacyLevel, ageConfirmed, level: req.user.questionPreference });

  const seenRows = await prisma.seenQuestion.findMany({ where: { userId: req.user.id }, select: { questionId: true } });
  const seenIds = seenRows.map((r) => r.questionId);
  const excludeIds = [...new Set([...seenIds, ...clientExclude])];

  let where = excludeIds.length ? { ...baseWhere, id: { notIn: excludeIds } } : baseWhere;
  let count = await prisma.question.count({ where });

  if (count === 0 && seenIds.length > 0) {
    // The eligible pool has been fully shown — reset tracking for just this
    // scope and start the cycle again (still avoiding the immediate repeat
    // the caller asked to exclude).
    const scopedIds = (await prisma.question.findMany({ where: baseWhere, select: { id: true } })).map((q) => q.id);
    await prisma.seenQuestion.deleteMany({ where: { userId: req.user.id, questionId: { in: scopedIds } } });
    where = clientExclude.length ? { ...baseWhere, id: { notIn: clientExclude } } : baseWhere;
    count = await prisma.question.count({ where });
  }

  if (count === 0) {
    throw new ApiError(404, 'No more questions in this category right now');
  }

  const skip = Math.floor(Math.random() * count);
  const [question] = await prisma.question.findMany({ where, skip, take: 1 });

  await prisma.seenQuestion.upsert({
    where: { userId_questionId: { userId: req.user.id, questionId: question.id } },
    update: { seenAt: new Date() },
    create: { userId: req.user.id, questionId: question.id },
  });

  res.json({
    question: {
      id: question.id,
      category: question.category,
      subcategory: question.subcategory,
      intimacyLevel: question.intimacyLevel,
      questionText: question.questionText,
      responseType: question.responseType,
      options: question.options ? JSON.parse(question.options) : null,
      ageRestricted: question.ageRestricted,
    },
  });
});

// Shared delivery path: creates the Message + SentQuestion pair, emits a
// personalized 'new-message' to both members' own rooms (so a masked
// ASK_ME_ANYTHING question never leaks its text to the recipient's socket
// before they reveal it), and returns the fully-included message.
async function deliverQuestionMessage({
  conversationId,
  senderId,
  recipientId,
  mode,
  questionId,
  category,
  subcategory,
  intimacyLevel,
  responseType,
  options,
  customText,
  revealed,
  selfAnswer,
  senderAnswer,
}) {
  const { message } = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.message.create({
      data: { conversationId, senderId, type: 'QUESTION', content: null },
    });

    await tx.sentQuestion.create({
      data: {
        questionId: questionId || null,
        customText: customText || null,
        mode,
        category: category || null,
        subcategory: subcategory || null,
        intimacyLevel: intimacyLevel || null,
        responseType: responseType || 'TEXT',
        options: options || null,
        conversationId,
        messageId: createdMessage.id,
        senderId,
        recipientId,
        revealed,
        answer: selfAnswer || null,
        answeredById: selfAnswer ? senderId : null,
        answeredAt: selfAnswer ? new Date() : null,
        senderAnswer: senderAnswer || null,
        senderAnsweredAt: senderAnswer ? new Date() : null,
      },
    });

    return { message: createdMessage };
  });

  const fullMessage = await prisma.message.findUnique({ where: { id: message.id }, include: MESSAGE_INCLUDE });

  const io = getIO();
  if (io) {
    io.to(`user:${senderId}`).emit('new-message', serializeMessage(fullMessage, senderId));
    io.to(`user:${recipientId}`).emit('new-message', serializeMessage(fullMessage, recipientId));
  }

  return fullMessage;
}

export const sendQuestion = asyncHandler(async (req, res) => {
  const { conversationId, questionId, customText, mode = 'SURPRISE', answer } = req.body;
  if (!conversationId) throw new ApiError(400, 'conversationId is required');
  if (!VALID_MODES.has(mode)) throw new ApiError(400, 'Unknown question mode');

  await requireMembership(conversationId, req.user.id);
  const recipientId = await getOtherMemberId(conversationId, req.user.id);
  if (!recipientId) throw new ApiError(400, 'This conversation has no other participant');

  const normalizedMode = mode;

  let question = null;
  let category = null;
  let subcategory = null;
  let intimacyLevel = null;
  let responseType = 'TEXT';
  let options = null;
  let text = null;

  if (normalizedMode === 'ASK_ME_ANYTHING') {
    text = sanitizeText(customText, 300);
    if (!text) throw new ApiError(400, 'Write a question to send');
  } else {
    if (questionId) {
      question = await prisma.question.findUnique({ where: { id: questionId } });
      if (!question || !question.active) throw new ApiError(404, 'Question not found');
      category = question.category;
      subcategory = question.subcategory;
      intimacyLevel = question.intimacyLevel;
      responseType = question.responseType;
      options = question.options;
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
  let senderAnswer = null;
  if (normalizedMode === 'SURPRISE' && answer !== undefined && answer !== null && answer !== '') {
    selfAnswer = validateAnswerForType(answer, responseType, options);
  }
  if (normalizedMode === 'ANSWER_TOGETHER') {
    if (answer === undefined || answer === null || answer === '') {
      throw new ApiError(400, 'Answer Together requires your own answer first');
    }
    senderAnswer = validateAnswerForType(answer, responseType, options);
  }

  const fullMessage = await deliverQuestionMessage({
    conversationId,
    senderId: req.user.id,
    recipientId,
    mode: normalizedMode,
    questionId: question?.id,
    category,
    subcategory,
    intimacyLevel,
    responseType,
    options,
    customText: text,
    revealed: normalizedMode !== 'ASK_ME_ANYTHING',
    selfAnswer,
    senderAnswer,
  });

  const notificationTitle =
    normalizedMode === 'ASK_ME_ANYTHING'
      ? 'Someone has a question for you 👀'
      : normalizedMode === 'ANSWER_TOGETHER'
      ? `${req.user.fullName} wants to answer a question together`
      : `${req.user.fullName} sent you a surprise question`;

  await createNotification({
    recipientId,
    type: 'NEW_QUESTION',
    title: notificationTitle,
    body: normalizedMode === 'ASK_ME_ANYTHING' ? 'Open your chat to reveal it.' : text || question?.questionText,
    data: { conversationId, messageId: fullMessage.id, sentQuestionId: fullMessage.sentQuestion?.id },
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
  if (sentQuestion.skippedByRecipient) throw new ApiError(400, 'You skipped this question');
  if (sentQuestion.mode === 'ASK_ME_ANYTHING' && !sentQuestion.revealed) {
    throw new ApiError(400, 'Reveal the question before answering');
  }

  const answer = validateAnswerForType(req.body.answer, sentQuestion.responseType, sentQuestion.options);

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

// Consent/comfort: the recipient can always back out of a 18+ (or any)
// question without the sender ever being told. Only the recipient's own
// other devices/tabs hear about it — nothing goes to the sender's room and no
// notification is created.
export const skipSentQuestion = asyncHandler(async (req, res) => {
  const sentQuestion = await loadOwnedSentQuestion(req.params.id, req.user.id);
  if (sentQuestion.recipientId !== req.user.id) throw new ApiError(403, 'Only the recipient can skip this question');
  if (sentQuestion.answer) throw new ApiError(400, 'This question has already been answered');

  const updated = sentQuestion.skippedByRecipient
    ? sentQuestion
    : await prisma.sentQuestion.update({
        where: { id: sentQuestion.id },
        data: { skippedByRecipient: true, skippedAt: new Date() },
        include: { question: true },
      });

  const io = getIO();
  if (io) {
    io.to(`user:${req.user.id}`).emit('question-skipped', {
      messageId: updated.messageId,
      sentQuestion: serializeSentQuestion(updated, req.user.id),
    });
  }

  res.json({ sentQuestion: serializeSentQuestion(updated, req.user.id) });
});

// --- Saved questions (personal bookmarks) ---

function serializeSavedQuestion(s) {
  return {
    id: s.id,
    category: s.category || s.question?.category || null,
    subcategory: s.question?.subcategory || null,
    responseType: s.question?.responseType || 'TEXT',
    questionText: s.customText || s.question?.questionText || null,
    ageRestricted: s.question?.ageRestricted || false,
    createdAt: s.createdAt,
  };
}

export const listSavedQuestions = asyncHandler(async (req, res) => {
  const saved = await prisma.savedQuestion.findMany({
    where: { userId: req.user.id },
    include: { question: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ saved: saved.map(serializeSavedQuestion) });
});

export const saveQuestion = asyncHandler(async (req, res) => {
  const { questionId, customText, category } = req.body;
  if (!questionId && !customText) throw new ApiError(400, 'questionId or customText is required');

  let resolvedCategory = category || null;
  if (questionId) {
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new ApiError(404, 'Question not found');
    if (question.category === 'NAUGHTY_18' && !isAgeConfirmed(req)) {
      throw new ApiError(403, 'Please confirm you are 18+ to save this question');
    }
    resolvedCategory = question.category;
  }

  const saved = await prisma.savedQuestion.create({
    data: {
      userId: req.user.id,
      questionId: questionId || null,
      customText: questionId ? null : sanitizeText(customText, 500),
      category: resolvedCategory,
    },
    include: { question: true },
  });

  res.status(201).json({ saved: serializeSavedQuestion(saved) });
});

export const unsaveQuestion = asyncHandler(async (req, res) => {
  const saved = await prisma.savedQuestion.findUnique({ where: { id: req.params.id } });
  if (!saved || saved.userId !== req.user.id) throw new ApiError(404, 'Saved question not found');
  await prisma.savedQuestion.delete({ where: { id: saved.id } });
  res.json({ message: 'Removed' });
});

// --- Personalization: custom questions (private, or sent to partner now/later) ---

function serializeCustomQuestion(cq) {
  return {
    id: cq.id,
    questionText: cq.questionText,
    category: cq.category,
    ageRestricted: cq.ageRestricted,
    visibility: cq.visibility,
    scheduledFor: cq.scheduledFor,
    deliveredAt: cq.deliveredAt,
    status: cq.visibility === 'PRIVATE' ? 'PRIVATE' : cq.deliveredAt ? 'DELIVERED' : 'SCHEDULED',
    createdAt: cq.createdAt,
  };
}

// Exported so the scheduler (src/utils/questionScheduler.js) can reuse the
// exact same delivery + notification path as an immediate send.
export async function deliverCustomQuestionRecord(customQuestion) {
  const fullMessage = await deliverQuestionMessage({
    conversationId: customQuestion.conversationId,
    senderId: customQuestion.authorId,
    recipientId: customQuestion.recipientId,
    mode: 'SURPRISE',
    category: customQuestion.category,
    subcategory: null,
    responseType: 'TEXT',
    customText: customQuestion.questionText,
    revealed: true,
  });

  await prisma.customQuestion.update({
    where: { id: customQuestion.id },
    data: { deliveredAt: new Date(), sentQuestionId: fullMessage.sentQuestion?.id || null },
  });

  await createNotification({
    recipientId: customQuestion.recipientId,
    type: 'NEW_QUESTION',
    title: 'Your partner sent you a personal question',
    body: customQuestion.questionText,
    data: { conversationId: customQuestion.conversationId, messageId: fullMessage.id, sentQuestionId: fullMessage.sentQuestion?.id },
  });
}

export async function deliverDueCustomQuestions() {
  const due = await prisma.customQuestion.findMany({
    where: { visibility: 'PARTNER', deliveredAt: null, scheduledFor: { lte: new Date() } },
  });
  for (const cq of due) {
    try {
      await deliverCustomQuestionRecord(cq);
    } catch (err) {
      console.error('Failed to deliver scheduled question', cq.id, err);
    }
  }
  return due.length;
}

export const createCustomQuestion = asyncHandler(async (req, res) => {
  const { questionText, category, ageRestricted, visibility = 'PRIVATE', conversationId, scheduledFor } = req.body;
  const text = sanitizeText(questionText, 500);
  if (!text) throw new ApiError(400, 'Write a question');

  const normalizedVisibility = visibility === 'PARTNER' ? 'PARTNER' : 'PRIVATE';
  const isAgeRestricted = Boolean(ageRestricted);
  if (isAgeRestricted && !isAgeConfirmed(req)) {
    throw new ApiError(403, 'Please confirm you are 18+ to mark this question 18+');
  }

  let recipientId = null;
  let resolvedConversationId = null;
  if (normalizedVisibility === 'PARTNER') {
    if (!conversationId) throw new ApiError(400, 'conversationId is required to send to your partner');
    await requireMembership(conversationId, req.user.id);
    recipientId = await getOtherMemberId(conversationId, req.user.id);
    if (!recipientId) throw new ApiError(400, 'This conversation has no other participant');
    resolvedConversationId = conversationId;
  }

  let scheduledDate = null;
  if (scheduledFor) {
    const parsed = new Date(scheduledFor);
    if (Number.isNaN(parsed.getTime())) throw new ApiError(400, 'Invalid scheduledFor date');
    if (parsed.getTime() > Date.now()) scheduledDate = parsed;
  }

  const customQuestion = await prisma.customQuestion.create({
    data: {
      authorId: req.user.id,
      recipientId,
      conversationId: resolvedConversationId,
      questionText: text,
      category: category || null,
      ageRestricted: isAgeRestricted,
      visibility: normalizedVisibility,
      scheduledFor: scheduledDate,
    },
  });

  if (normalizedVisibility === 'PARTNER' && !scheduledDate) {
    await deliverCustomQuestionRecord(customQuestion);
  }

  const fresh = await prisma.customQuestion.findUnique({ where: { id: customQuestion.id } });
  res.status(201).json({ customQuestion: serializeCustomQuestion(fresh) });
});

export const listMyCustomQuestions = asyncHandler(async (req, res) => {
  const questions = await prisma.customQuestion.findMany({
    where: { authorId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ customQuestions: questions.map(serializeCustomQuestion) });
});

export const deleteCustomQuestion = asyncHandler(async (req, res) => {
  const cq = await prisma.customQuestion.findUnique({ where: { id: req.params.id } });
  if (!cq || cq.authorId !== req.user.id) throw new ApiError(404, 'Question not found');
  if (cq.deliveredAt) throw new ApiError(400, 'This question has already been sent and cannot be removed');
  await prisma.customQuestion.delete({ where: { id: cq.id } });
  res.json({ message: 'Removed' });
});
