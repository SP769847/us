import prisma from '../config/prisma.js';
import { QUESTION_BANK, QUESTION_CATEGORIES } from './contentBanks.js';

// Idempotent: safe to run on every server boot. Upserts by the
// (category, questionText) unique key, so re-running after adding new
// questions to contentBanks.js only inserts the new rows.
export async function seedQuestions() {
  const rows = [];
  for (const [category, questions] of Object.entries(QUESTION_BANK)) {
    const ageRestricted = Boolean(QUESTION_CATEGORIES[category]?.ageRestricted);
    for (const questionText of questions) {
      rows.push({ category, questionText, ageRestricted });
    }
  }

  for (const row of rows) {
    await prisma.question.upsert({
      where: { category_questionText: { category: row.category, questionText: row.questionText } },
      update: {},
      create: row,
    });
  }

  return rows.length;
}
