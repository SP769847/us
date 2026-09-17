import prisma from '../config/prisma.js';
import { QUESTION_BANK, QUESTION_CATEGORIES } from './contentBanks.js';

// Collapses internal whitespace and trims — applied before the uniqueness
// check/storage so accidental double-spacing or stray trailing whitespace
// never creates a near-duplicate row alongside the "clean" version.
function normalizeQuestionText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

// Idempotent: safe to run on every server boot. Upserts by the
// (category, questionText) unique key, so re-running after adding new
// questions to contentBanks.js only inserts the new rows.
export async function seedQuestions() {
  const rows = [];
  const seenKeys = new Set();

  for (const [category, questions] of Object.entries(QUESTION_BANK)) {
    const ageRestricted = Boolean(QUESTION_CATEGORIES[category]?.ageRestricted);
    for (const entry of questions) {
      // Entries are either a plain string, or { text, subcategory,
      // intimacyLevel, responseType, options } for categories (currently
      // NAUGHTY_18) that carry extra metadata.
      const isObject = typeof entry === 'object' && entry !== null;
      const questionText = normalizeQuestionText(isObject ? entry.text : entry);

      const dedupeKey = `${category}::${questionText.toLowerCase()}`;
      if (seenKeys.has(dedupeKey)) continue; // guard against accidental duplicates in the source bank
      seenKeys.add(dedupeKey);

      rows.push({
        category,
        questionText,
        subcategory: isObject ? entry.subcategory || null : null,
        intimacyLevel: isObject ? entry.intimacyLevel || null : null,
        responseType: isObject && entry.responseType ? entry.responseType : 'TEXT',
        options: isObject && entry.options ? JSON.stringify(entry.options) : null,
        ageRestricted,
      });
    }
  }

  for (const row of rows) {
    await prisma.question.upsert({
      where: { category_questionText: { category: row.category, questionText: row.questionText } },
      update: {
        subcategory: row.subcategory,
        intimacyLevel: row.intimacyLevel,
        responseType: row.responseType,
        options: row.options,
        ageRestricted: row.ageRestricted,
      },
      create: row,
    });
  }

  // One-time cleanup: Naughty 18+ questions from before the subcategory
  // system was introduced don't fit any subcategory chip — retire them so
  // they only ever stop showing up, rather than lingering as untagged
  // entries in the "Any Naughty Question" pool. Every current NAUGHTY_18
  // bank entry carries a subcategory, so this only ever touches stale rows.
  await prisma.question.updateMany({
    where: { category: 'NAUGHTY_18', subcategory: null, active: true },
    data: { active: false },
  });

  return rows.length;
}
