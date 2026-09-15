import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { DAILY_QUESTIONS, CHALLENGES, SURPRISE_PROMPTS, pickRandom } from '../utils/contentBanks.js';

const GAME_SUGGESTIONS = ['THIS_OR_THAT', 'WOULD_YOU_RATHER', 'TRUTH_OR_DARE', 'WHO_KNOWS_ME_BETTER'];

export const surpriseMe = asyncHandler(async (req, res) => {
  const generators = [
    async () => ({ type: 'QUESTION', text: pickRandom(DAILY_QUESTIONS) }),
    async () => ({ type: 'CHALLENGE', text: pickRandom(CHALLENGES) }),
    async () => ({ type: 'COMPLIMENT', text: pickRandom(SURPRISE_PROMPTS.filter((p) => p.type === 'COMPLIMENT')).text() }),
    async () => ({ type: 'GAME_SUGGESTION', text: `How about a round of ${pickRandom(GAME_SUGGESTIONS).replace(/_/g, ' ').toLowerCase()}?`, gameType: pickRandom(GAME_SUGGESTIONS) }),
    async () => {
      const memory = await prisma.memory.findFirst({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, skip: Math.floor(Math.random() * 5) });
      if (!memory) return null;
      return { type: 'MEMORY', text: memory.title, memoryId: memory.id };
    },
    async () => {
      const note = await prisma.loveNote.findFirst({
        where: { recipientId: req.user.id, kind: 'LOVE_NOTE', OR: [{ unlockAt: null }, { unlockAt: { lte: new Date() } }] },
        orderBy: { createdAt: 'desc' },
      });
      if (!note) return null;
      return { type: 'LOVE_NOTE', text: note.title, noteId: note.id };
    },
  ];

  const shuffled = generators.sort(() => Math.random() - 0.5);
  let result = null;
  for (const gen of shuffled) {
    result = await gen();
    if (result) break;
  }

  res.json({ surprise: result || { type: 'COMPLIMENT', text: 'You are loved more than you know.' } });
});
