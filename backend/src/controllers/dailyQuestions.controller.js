import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { DAILY_QUESTIONS, dailyDeterministic } from '../utils/contentBanks.js';
import { areConnected } from '../services/connectionService.js';
import { createNotification } from '../services/notificationService.js';
import { sanitizeText } from '../utils/validators.js';

async function getOrCreateTodayQuestion() {
  const prompt = dailyDeterministic(DAILY_QUESTIONS);
  let question = await prisma.dailyQuestion.findFirst({ where: { prompt } });
  if (!question) {
    question = await prisma.dailyQuestion.create({ data: { prompt, category: 'DAILY' } });
  }
  return question;
}

export const getTodayQuestion = asyncHandler(async (req, res) => {
  const question = await getOrCreateTodayQuestion();
  const myAnswer = await prisma.questionAnswer.findFirst({
    where: { questionId: question.id, userId: req.user.id },
  });
  res.json({ question: { id: question.id, prompt: question.prompt }, myAnswer });
});

export const answerQuestion = asyncHandler(async (req, res) => {
  const { answer, shareWithUsername } = req.body;
  if (!answer) throw new ApiError(400, 'Please write an answer');

  const question = await prisma.dailyQuestion.findUnique({ where: { id: req.params.id } });
  if (!question) throw new ApiError(404, 'Question not found');

  let sharedWithUserId = null;
  if (shareWithUsername) {
    const target = await prisma.user.findUnique({ where: { username: shareWithUsername.toLowerCase() } });
    if (!target) throw new ApiError(404, 'Recipient not found');
    if (!(await areConnected(req.user.id, target.id))) {
      throw new ApiError(403, 'You can only share answers with your connections');
    }
    sharedWithUserId = target.id;
  }

  const record = await prisma.questionAnswer.create({
    data: {
      questionId: question.id,
      userId: req.user.id,
      answer: sanitizeText(answer, 1000),
      sharedWithUserId,
    },
  });

  if (sharedWithUserId) {
    await createNotification({
      recipientId: sharedWithUserId,
      type: 'DAILY_ANSWER_SHARED',
      title: `${req.user.fullName} shared their answer with you`,
      body: question.prompt,
      data: { answerId: record.id },
    });
  }

  res.status(201).json({ answer: record });
});

export const myAnswerHistory = asyncHandler(async (req, res) => {
  const answers = await prisma.questionAnswer.findMany({
    where: { userId: req.user.id },
    include: { question: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ answers });
});

export const sharedWithMe = asyncHandler(async (req, res) => {
  const answers = await prisma.questionAnswer.findMany({
    where: { sharedWithUserId: req.user.id },
    include: { question: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({
    answers: answers.map((a) => ({
      id: a.id,
      answer: a.answer,
      createdAt: a.createdAt,
      question: { id: a.question.id, prompt: a.question.prompt },
      from: { id: a.user.id, fullName: a.user.fullName, username: a.user.username, avatarUrl: a.user.avatarUrl },
    })),
  });
});
