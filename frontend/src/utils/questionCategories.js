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
