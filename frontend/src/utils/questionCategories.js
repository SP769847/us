// UI-only metadata (icon/label/accent) for question categories. The actual
// question text always comes from the backend (see /api/questions) — this
// file never hardcodes question content.
export const CATEGORY_META = {
  ROMANTIC: { label: 'Romantic', emoji: '❤️', accent: 'from-blush-500/25 to-blush-500/5' },
  CUTE: { label: 'Cute', emoji: '🥰', accent: 'from-plum-400/25 to-plum-400/5' },
  FUNNY: { label: 'Funny', emoji: '😂', accent: 'from-amber-400/20 to-amber-400/5' },
  DEEP: { label: 'Deep', emoji: '💭', accent: 'from-sky-400/20 to-sky-400/5' },
  NAUGHTY_18: { label: 'Naughty 18+', emoji: '🔥', accent: 'from-plum-600/30 to-blush-600/10' },
  RANDOM: { label: 'Random', emoji: '✨', accent: 'from-white/15 to-white/0' },
};

export const CATEGORY_ORDER = ['ROMANTIC', 'CUTE', 'FUNNY', 'DEEP', 'NAUGHTY_18', 'RANDOM'];

export function categoryMeta(key) {
  return CATEGORY_META[key] || { label: key || 'Question', emoji: '✨', accent: 'from-white/15 to-white/0' };
}

// Naughty 18+ subcategories (themes) — order matches the spec's presentation order.
export const NAUGHTY_SUBCATEGORY_META = {
  ATTRACTION: { label: 'Attraction', emoji: '💕' },
  SEXUAL_PREFERENCES: { label: 'Sexual Preferences', emoji: '🔥' },
  TURN_ONS: { label: 'Turn-Ons', emoji: '👀' },
  FANTASIES_CURIOSITY: { label: 'Fantasies & Curiosity', emoji: '😈' },
  PERSONAL_EXPERIENCE: { label: 'Personal Experience', emoji: '💭' },
  INTIMACY_RELATIONSHIP: { label: 'Intimacy & Relationship', emoji: '🛏️' },
  BOUNDARIES_PREFERENCES: { label: 'Boundaries & Consent', emoji: '🔐' },
  COUPLE_CONFESSIONS: { label: 'Couple Confessions', emoji: '🥰' },
  FLIRTY_COUPLE: { label: 'Flirty Couple', emoji: '😏' },
  PERSONAL_RATING: { label: 'Personal Rating', emoji: '🌶️' },
};

export const NAUGHTY_SUBCATEGORY_ORDER = Object.keys(NAUGHTY_SUBCATEGORY_META);

export function subcategoryMeta(key) {
  return NAUGHTY_SUBCATEGORY_META[key] || { label: key || 'Naughty', emoji: '🔥' };
}

// The "how personal do you want to get" depth dial — independent of theme.
// Every Naughty 18+ question carries one of these.
export const INTIMACY_LEVEL_META = {
  ROMANTIC: { label: 'Romantic', emoji: '💗' },
  FLIRTY: { label: 'Flirty', emoji: '🌶️' },
  INTIMATE: { label: 'Intimate', emoji: '🔥' },
  DEEPLY_PERSONAL: { label: 'Deeply Personal', emoji: '🔐' },
};

export const INTIMACY_LEVEL_ORDER = Object.keys(INTIMACY_LEVEL_META);

export function intimacyLevelMeta(key) {
  return INTIMACY_LEVEL_META[key] || null;
}

// The "simple preference setting" from mildest to most mature — each level
// cumulatively unlocks more content. The server is still the source of truth
// (and re-enforces the 18+ gate); this is just the picker's presentation.
export const CONTENT_LEVEL_META = {
  CUTE: { label: 'Cute only', emoji: '🥰' },
  ROMANTIC: { label: 'Romantic', emoji: '❤️' },
  FLIRTY: { label: 'Flirty', emoji: '😉' },
  INTIMATE: { label: 'Intimate', emoji: '💗' },
  EXPLICIT_18: { label: '18+', emoji: '🔥' },
};

export const CONTENT_LEVEL_ORDER = Object.keys(CONTENT_LEVEL_META);

// Levels that require an 18+ confirmation to select.
export const AGE_GATED_LEVELS = new Set(['FLIRTY', 'INTIMATE', 'EXPLICIT_18']);

export const AGE_GATE_STORAGE_KEY = 'us:ageConfirmed18';

export function isAgeConfirmed() {
  try {
    return localStorage.getItem(AGE_GATE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAgeConfirmed() {
  try {
    localStorage.setItem(AGE_GATE_STORAGE_KEY, 'true');
  } catch {
    // ignore storage failures (private browsing, etc.)
  }
}
