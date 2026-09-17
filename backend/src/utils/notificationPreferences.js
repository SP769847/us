// Central definition of which notification types exist per channel, and the
// default on/off state for each. Used by both the preferences API and the
// NotificationService fan-out so the two can never drift apart.

export const IN_APP_TYPES = [
  'NEW_MESSAGE',
  'CONNECTION_REQUEST',
  'CONNECTION_ACCEPTED',
  'MISS_YOU',
  'WAITING_FOR_REPLY',
  'NEW_LOVE_NOTE',
  'CHALLENGE_RECEIVED',
  'NEW_QUESTION',
];

export const EMAIL_TYPES = ['MISS_YOU', 'WAITING_FOR_REPLY', 'NEW_MESSAGE', 'CONNECTION_REQUEST'];

export const WHATSAPP_TYPES = ['MISS_YOU', 'WAITING_FOR_REPLY', 'CONNECTION_REQUEST'];

function defaultsFor(types, defaultValue) {
  return Object.fromEntries(types.map((t) => [t, defaultValue]));
}

// In-app defaults to "on" for everything (matches existing behaviour before
// this feature existed). Email and WhatsApp default to "off" — both require
// explicit opt-in per the spec.
export function defaultPreferences() {
  return {
    inApp: defaultsFor(IN_APP_TYPES, true),
    email: defaultsFor(EMAIL_TYPES, false),
    whatsapp: defaultsFor(WHATSAPP_TYPES, false),
  };
}

export function parsePreferences(raw) {
  const defaults = defaultPreferences();
  if (!raw) return defaults;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaults;
  }
  return {
    inApp: { ...defaults.inApp, ...(parsed.inApp || {}) },
    email: { ...defaults.email, ...(parsed.email || {}) },
    whatsapp: { ...defaults.whatsapp, ...(parsed.whatsapp || {}) },
  };
}

// Merges a partial update (only the keys the client sent) onto the user's
// current preferences, keeping every other value untouched.
export function mergePreferences(currentRaw, updates) {
  const current = parsePreferences(currentRaw);
  const merged = {
    inApp: { ...current.inApp },
    email: { ...current.email },
    whatsapp: { ...current.whatsapp },
  };
  for (const channel of ['inApp', 'email', 'whatsapp']) {
    const validTypes = channel === 'inApp' ? IN_APP_TYPES : channel === 'email' ? EMAIL_TYPES : WHATSAPP_TYPES;
    const incoming = updates?.[channel];
    if (!incoming || typeof incoming !== 'object') continue;
    for (const type of validTypes) {
      if (typeof incoming[type] === 'boolean') merged[channel][type] = incoming[type];
    }
  }
  return merged;
}
