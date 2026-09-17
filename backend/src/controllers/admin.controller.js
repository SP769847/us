import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { privateUser } from '../utils/serializers.js';
import { sanitizeText } from '../utils/validators.js';
import { QUESTION_CATEGORIES, NAUGHTY_SUBCATEGORIES, INTIMACY_LEVELS } from '../utils/contentBanks.js';

const VALID_ADMIN_CATEGORIES = new Set(Object.keys(QUESTION_CATEGORIES));
const VALID_ADMIN_SUBCATEGORIES = new Set(Object.keys(NAUGHTY_SUBCATEGORIES));
const VALID_ADMIN_INTIMACY_LEVELS = new Set(Object.keys(INTIMACY_LEVELS));
const VALID_ADMIN_RESPONSE_TYPES = new Set(['TEXT', 'MULTIPLE_CHOICE', 'YES_NO', 'SCALE_1_10']);
const normalizeQuestionText = (text) => text.replace(/\s+/g, ' ').trim();

export const getStats = asyncHandler(async (req, res) => {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, activeUsers, newUsers, totalConnections, totalMessages, pendingReports] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isOnline: true } }),
    prisma.user.count({ where: { createdAt: { gt: weekAgo } } }),
    prisma.connection.count(),
    prisma.message.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),
  ]);

  res.json({ totalUsers, activeUsers, newUsers, totalConnections, totalMessages, pendingReports });
});

export const listUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const users = await prisma.user.findMany({
    // Note: MySQL/TiDB's `contains` case-sensitivity depends on the column's
    // collation (Prisma's "mode" filter argument is Postgres/Mongo-only and
    // is not valid here). Default TiDB collations are usually case-insensitive;
    // if this ever behaves case-sensitively, alter the column collation to a
    // `_ci` one rather than trying to pass `mode` here.
    where: q
      ? {
          OR: [{ username: { contains: q } }, { email: { contains: q } }, { fullName: { contains: q } }],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ users: users.map(privateUser) });
});

export const suspendUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'ADMIN') throw new ApiError(400, 'Cannot suspend an admin account');

  const updated = await prisma.user.update({ where: { id: user.id }, data: { status: 'SUSPENDED' } });
  res.json({ user: privateUser(updated) });
});

export const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new ApiError(404, 'User not found');
  const updated = await prisma.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } });
  res.json({ user: privateUser(updated) });
});

export const listReports = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const reports = await prisma.report.findMany({
    where: status ? { status } : undefined,
    include: { reporter: true, reported: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    reports: reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      resolutionNote: r.resolutionNote,
      reporter: privateUser(r.reporter),
      reported: privateUser(r.reported),
    })),
  });
});

export const resolveReport = asyncHandler(async (req, res) => {
  const { status, resolutionNote } = req.body; // RESOLVED | DISMISSED
  if (!['RESOLVED', 'DISMISSED'].includes(status)) throw new ApiError(400, 'Invalid status');

  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!report) throw new ApiError(404, 'Report not found');

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: { status, resolutionNote: resolutionNote || null, resolvedAt: new Date() },
  });

  res.json({ report: updated });
});

// --- Question bank management ---
// Operates ONLY on the Question bank (the reusable prompt library). Never
// joins, queries, or returns SentQuestion rows — private answers between
// connected users are never reachable through this interface.

function serializeAdminQuestion(q) {
  return {
    id: q.id,
    category: q.category,
    subcategory: q.subcategory,
    intimacyLevel: q.intimacyLevel,
    questionText: q.questionText,
    responseType: q.responseType,
    options: q.options ? JSON.parse(q.options) : null,
    ageRestricted: q.ageRestricted,
    active: q.active,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}

export const adminListQuestions = asyncHandler(async (req, res) => {
  const { q, category, subcategory, intimacyLevel, active } = req.query;
  const where = {};
  if (q) where.questionText = { contains: String(q) };
  if (category) where.category = String(category).toUpperCase();
  if (subcategory) where.subcategory = String(subcategory).toUpperCase();
  if (intimacyLevel) where.intimacyLevel = String(intimacyLevel).toUpperCase();
  if (active === 'true') where.active = true;
  if (active === 'false') where.active = false;

  const take = Math.min(Number(req.query.limit) || 50, 200);
  const questions = await prisma.question.findMany({ where, orderBy: { createdAt: 'desc' }, take });
  res.json({ questions: questions.map(serializeAdminQuestion) });
});

function validateQuestionFields({ category, subcategory, intimacyLevel, responseType, options, ageRestricted }) {
  if (category && !VALID_ADMIN_CATEGORIES.has(category)) throw new ApiError(400, 'Unknown category');
  if (subcategory && !VALID_ADMIN_SUBCATEGORIES.has(subcategory)) throw new ApiError(400, 'Unknown subcategory');
  if (intimacyLevel && !VALID_ADMIN_INTIMACY_LEVELS.has(intimacyLevel)) throw new ApiError(400, 'Unknown intimacy level');
  if (responseType && !VALID_ADMIN_RESPONSE_TYPES.has(responseType)) throw new ApiError(400, 'Unknown response type');
  if (category !== 'NAUGHTY_18' && (subcategory || intimacyLevel)) {
    throw new ApiError(400, 'subcategory/intimacyLevel only apply to the NAUGHTY_18 category');
  }
  if (responseType === 'MULTIPLE_CHOICE') {
    if (!Array.isArray(options) || options.length < 2) {
      throw new ApiError(400, 'Multiple choice questions need at least two options');
    }
  }
  if (category === 'NAUGHTY_18' && !ageRestricted) {
    throw new ApiError(400, 'NAUGHTY_18 questions must be marked 18+');
  }
}

export const adminCreateQuestion = asyncHandler(async (req, res) => {
  const { category, subcategory, intimacyLevel, questionText, responseType = 'TEXT', options, ageRestricted } = req.body;
  const text = normalizeQuestionText(sanitizeText(questionText, 500));
  if (!text) throw new ApiError(400, 'questionText is required');
  if (!category) throw new ApiError(400, 'category is required');

  const resolvedAgeRestricted = category === 'NAUGHTY_18' ? true : Boolean(ageRestricted);
  validateQuestionFields({ category, subcategory, intimacyLevel, responseType, options, ageRestricted: resolvedAgeRestricted });

  const existing = await prisma.question.findUnique({ where: { category_questionText: { category, questionText: text } } });
  if (existing) throw new ApiError(409, 'This exact question already exists in this category');

  const question = await prisma.question.create({
    data: {
      category,
      subcategory: category === 'NAUGHTY_18' ? subcategory || null : null,
      intimacyLevel: category === 'NAUGHTY_18' ? intimacyLevel || null : null,
      questionText: text,
      responseType,
      options: responseType === 'MULTIPLE_CHOICE' ? JSON.stringify(options) : null,
      ageRestricted: resolvedAgeRestricted,
    },
  });

  res.status(201).json({ question: serializeAdminQuestion(question) });
});

export const adminUpdateQuestion = asyncHandler(async (req, res) => {
  const question = await prisma.question.findUnique({ where: { id: req.params.id } });
  if (!question) throw new ApiError(404, 'Question not found');

  const category = req.body.category ?? question.category;
  const subcategory = req.body.subcategory !== undefined ? req.body.subcategory : question.subcategory;
  const intimacyLevel = req.body.intimacyLevel !== undefined ? req.body.intimacyLevel : question.intimacyLevel;
  const responseType = req.body.responseType ?? question.responseType;
  const options = req.body.options !== undefined ? req.body.options : question.options ? JSON.parse(question.options) : null;
  const ageRestricted = req.body.ageRestricted !== undefined ? Boolean(req.body.ageRestricted) : question.ageRestricted;
  const active = req.body.active !== undefined ? Boolean(req.body.active) : question.active;

  const resolvedAgeRestricted = category === 'NAUGHTY_18' ? true : ageRestricted;
  validateQuestionFields({ category, subcategory, intimacyLevel, responseType, options, ageRestricted: resolvedAgeRestricted });

  let text = question.questionText;
  if (req.body.questionText !== undefined) {
    text = normalizeQuestionText(sanitizeText(req.body.questionText, 500));
    if (!text) throw new ApiError(400, 'questionText cannot be empty');
  }

  if (text !== question.questionText || category !== question.category) {
    const clash = await prisma.question.findUnique({ where: { category_questionText: { category, questionText: text } } });
    if (clash && clash.id !== question.id) throw new ApiError(409, 'This exact question already exists in this category');
  }

  const updated = await prisma.question.update({
    where: { id: question.id },
    data: {
      category,
      subcategory: category === 'NAUGHTY_18' ? subcategory || null : null,
      intimacyLevel: category === 'NAUGHTY_18' ? intimacyLevel || null : null,
      questionText: text,
      responseType,
      options: responseType === 'MULTIPLE_CHOICE' ? JSON.stringify(options) : null,
      ageRestricted: resolvedAgeRestricted,
      active,
    },
  });

  res.json({ question: serializeAdminQuestion(updated) });
});

// "Delete" is always a deactivation, never a hard delete — bank questions
// referenced by already-sent questions in couples' private chat history must
// keep resolving (SentQuestion falls back to Question.questionText), so the
// row has to keep existing even once retired from new sends.
export const adminDeactivateQuestion = asyncHandler(async (req, res) => {
  const question = await prisma.question.findUnique({ where: { id: req.params.id } });
  if (!question) throw new ApiError(404, 'Question not found');
  const updated = await prisma.question.update({ where: { id: question.id }, data: { active: false } });
  res.json({ question: serializeAdminQuestion(updated) });
});
