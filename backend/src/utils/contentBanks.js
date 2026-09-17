export const DAILY_QUESTIONS = [
  "What's your favourite memory with me?",
  'What was your first impression of me?',
  "What's one thing we should do together soon?",
  'What makes you smile instantly?',
  "What's your dream date?",
  'What is a small thing I do that means a lot to you?',
  'What song reminds you of us?',
  'What is something you are grateful for today?',
  'What is a place you would love for us to visit?',
  'What made you laugh the hardest this week?',
];

export const CHALLENGES = [
  'Tell me one thing you love about me.',
  'Send me a sweet voice message.',
  'Describe our perfect date.',
  'Tell me your favourite memory of us.',
  'Choose our next date.',
  "Ask me something you've always wanted to ask.",
  'Write a two-line poem about today.',
  'Tell me your favourite thing about how we met.',
  'Send me a photo that makes you think of me.',
  'Describe me in three words and explain why.',
];

export const THIS_OR_THAT = [
  { a: 'Coffee ☕', b: 'Tea 🍵' },
  { a: 'Beach 🏖️', b: 'Mountains ⛰️' },
  { a: 'Movie night 🎬', b: 'Game night 🎲' },
  { a: 'Sunrise 🌅', b: 'Sunset 🌇' },
  { a: 'Sweet 🍰', b: 'Savoury 🥨' },
  { a: 'Texting 💬', b: 'Calling 📞' },
  { a: 'Winter ❄️', b: 'Summer ☀️' },
  { a: 'Cooking at home 🍳', b: 'Eating out 🍽️' },
  { a: 'Dogs 🐶', b: 'Cats 🐱' },
  { a: 'City trip 🏙️', b: 'Countryside 🌾' },
];

export const WOULD_YOU_RATHER = [
  { a: 'Take a spontaneous weekend trip together', b: 'Plan a dream vacation a year in advance' },
  { a: 'Cook a meal together every night', b: 'Try a new restaurant every week' },
  { a: 'Get unlimited flights', b: 'Get unlimited concert tickets' },
  { a: 'Wake up early together', b: 'Stay up late together' },
  { a: 'Have a slow lazy Sunday', b: 'Have an adventure-packed Sunday' },
  { a: 'Exchange handwritten letters', b: 'Exchange voice messages' },
  { a: 'Live by the beach', b: 'Live in the mountains' },
  { a: 'Never fight but rarely deep-talk', b: 'Occasionally argue but always talk it out' },
];

export const TRUTH_OR_DARE = [
  { type: 'TRUTH', prompt: "What's the most romantic thing anyone has done for you?" },
  { type: 'TRUTH', prompt: 'What first made you curious about me?' },
  { type: 'TRUTH', prompt: 'What is a small habit of mine you secretly love?' },
  { type: 'DARE', prompt: 'Send a compliment using only emojis.' },
  { type: 'DARE', prompt: 'Send your partner a voice note singing a line of a song.' },
  { type: 'TRUTH', prompt: 'What is your favourite inside joke between us?' },
  { type: 'DARE', prompt: 'Text me the first nice thought you have about me tomorrow morning.' },
];

export const WHO_KNOWS_ME_BETTER = [
  "What's my favourite food?",
  'What is my biggest fear?',
  'What was I like as a kid?',
  'What is my dream job?',
  'What is my favourite way to relax?',
  'What is my go-to comfort show or movie?',
  'What is one thing that always makes my day better?',
];

export const SURPRISE_PROMPTS = [
  { type: 'QUESTION', text: () => DAILY_QUESTIONS[Math.floor(Math.random() * DAILY_QUESTIONS.length)] },
  { type: 'CHALLENGE', text: () => CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)] },
  {
    type: 'COMPLIMENT',
    text: () =>
      [
        'Your laugh is one of my favourite sounds.',
        'You make ordinary days feel special.',
        "I love how you always know what to say.",
        'Being around you feels like home.',
        'You have the kindest heart I know.',
      ][Math.floor(Math.random() * 5)],
  },
];

// Couple Questions bank — grouped by category for the Surprise Questions
// feature. Seeded into the Question table on server startup (see
// src/utils/seedQuestions.js). Add new questions here; no frontend changes
// needed since the UI reads from the database.
export const QUESTION_CATEGORIES = {
  ROMANTIC: { label: 'Romantic', emoji: '❤️', ageRestricted: false },
  CUTE: { label: 'Cute', emoji: '🥰', ageRestricted: false },
  FUNNY: { label: 'Funny', emoji: '😂', ageRestricted: false },
  DEEP: { label: 'Deep', emoji: '💭', ageRestricted: false },
  NAUGHTY_18: { label: 'Naughty 18+', emoji: '🔥', ageRestricted: true },
  RANDOM: { label: 'Random', emoji: '✨', ageRestricted: false },
};

// Subcategories within Naughty 18+ — mature, intimate, playful, consent-aware,
// never graphic. Each maps to its own chip in the UI.
export const NAUGHTY_SUBCATEGORIES = {
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

// The "how personal do you want to get" depth dial shown when a user opens
// Naughty 18+ — independent of subcategory (theme). Every NAUGHTY_18 bank
// question carries one of these.
export const INTIMACY_LEVELS = {
  ROMANTIC: { label: 'Romantic', emoji: '💗', order: 1 },
  FLIRTY: { label: 'Flirty', emoji: '🌶️', order: 2 },
  INTIMATE: { label: 'Intimate', emoji: '🔥', order: 3 },
  DEEPLY_PERSONAL: { label: 'Deeply Personal', emoji: '🔐', order: 4 },
};

// A user's chosen "Surprise Me" content level, from mildest to most mature.
// Each level cumulatively unlocks more categories/subcategories — see
// LEVEL_CATEGORY_POOLS below (used by the /questions/random preference path).
// The 18+ age gate still applies server-side regardless of this preference.
export const CONTENT_LEVELS = {
  CUTE: { label: 'Cute only', emoji: '🥰' },
  ROMANTIC: { label: 'Romantic', emoji: '❤️' },
  FLIRTY: { label: 'Flirty', emoji: '😉' },
  INTIMATE: { label: 'Intimate', emoji: '💗' },
  EXPLICIT_18: { label: '18+', emoji: '🔥' },
};

// { categories: [...], naughtySubcategories: [...] } eligible for each level,
// cumulative (each level includes everything from the levels before it).
export const LEVEL_CATEGORY_POOLS = {
  CUTE: { categories: ['CUTE', 'FUNNY', 'RANDOM'], naughtySubcategories: [] },
  ROMANTIC: { categories: ['CUTE', 'FUNNY', 'RANDOM', 'ROMANTIC', 'DEEP'], naughtySubcategories: [] },
  FLIRTY: {
    categories: ['CUTE', 'FUNNY', 'RANDOM', 'ROMANTIC', 'DEEP', 'NAUGHTY_18'],
    naughtySubcategories: ['ATTRACTION', 'TURN_ONS', 'FLIRTY_COUPLE'],
  },
  INTIMATE: {
    categories: ['CUTE', 'FUNNY', 'RANDOM', 'ROMANTIC', 'DEEP', 'NAUGHTY_18'],
    naughtySubcategories: [
      'ATTRACTION',
      'TURN_ONS',
      'FLIRTY_COUPLE',
      'SEXUAL_PREFERENCES',
      'INTIMACY_RELATIONSHIP',
      'FANTASIES_CURIOSITY',
      'COUPLE_CONFESSIONS',
      'BOUNDARIES_PREFERENCES',
      'PERSONAL_RATING',
    ],
  },
  EXPLICIT_18: {
    categories: ['CUTE', 'FUNNY', 'RANDOM', 'ROMANTIC', 'DEEP', 'NAUGHTY_18'],
    naughtySubcategories: Object.keys(NAUGHTY_SUBCATEGORIES),
  },
};

export const QUESTION_BANK = {
  ROMANTIC: [
    'What made you realise you had feelings for me?',
    'What is the most romantic thing we have ever done together?',
    'How do you like to be shown love?',
    'What is a love song that reminds you of us?',
    'What is one promise you want us to always keep?',
    'What does forever with me look like to you?',
    'What is the sweetest thing I have ever said to you?',
    'What is your favourite way to spend a quiet evening with me?',
    'What is one thing you never want to stop doing together?',
    'If you could relive one date with me, which would it be?',
  ],
  CUTE: [
    'What is your favourite nickname for me?',
    'What is the little thing I do that always makes you smile?',
    'What is your favourite way to cuddle?',
    'What is a silly memory of us that still makes you laugh?',
    'What is one thing about me that you find adorable?',
    'What is your favourite photo of us and why?',
    'What is a tiny habit of mine that you secretly love?',
    'If we were a duo of cartoon characters, which would we be?',
    'What is the cutest thing that has happened between us?',
    'What is a pet name you would love for me to call you more?',
  ],
  FUNNY: [
    'What is the weirdest thing you find attractive about me?',
    'What is the funniest moment we have shared?',
    "If our relationship were a movie, what would the title be?",
    'What is one habit of mine that secretly annoys you (be honest)?',
    'What is the most ridiculous thing you have done to impress me?',
    'If we swapped bodies for a day, what would you do first?',
    'What is my most dramatic reaction to something small?',
    'What is a running joke only the two of us understand?',
    'What silly nickname would you give our relationship?',
    'What is the worst joke I have ever told you?',
  ],
  DEEP: [
    'What does a truly happy life look like to you?',
    'What is something you have never told anyone but me?',
    'What is a fear you have about our future, if any?',
    'How have I helped you grow as a person?',
    'What is something you want us to work on together?',
    'What does trust mean to you in our relationship?',
    'What is one thing you wish I understood better about you?',
    'What is a childhood experience that shaped who you are today?',
    'What do you need from me on your hardest days?',
    'What are you most proud of in our relationship?',
  ],
  NAUGHTY_18: [
    // 💕 Attraction
    { text: 'What is the first thing you notice about me?', subcategory: 'ATTRACTION', intimacyLevel: 'ROMANTIC' },
    { text: 'What do you find most irresistible about me?', subcategory: 'ATTRACTION', intimacyLevel: 'FLIRTY' },
    { text: "What's something I do that instantly increases the chemistry?", subcategory: 'ATTRACTION', intimacyLevel: 'FLIRTY' },
    { text: "What's your biggest turn-on about my personality?", subcategory: 'ATTRACTION', intimacyLevel: 'FLIRTY' },
    { text: "What's one thing about my appearance you secretly love?", subcategory: 'ATTRACTION', intimacyLevel: 'ROMANTIC' },
    { text: "What's your favourite part of my appearance?", subcategory: 'ATTRACTION', intimacyLevel: 'ROMANTIC' },
    { text: 'What makes you feel most desired by me?', subcategory: 'ATTRACTION', intimacyLevel: 'INTIMATE' },
    { text: "What's one thing I do that you find especially attractive?", subcategory: 'ATTRACTION', intimacyLevel: 'FLIRTY' },
    { text: 'What makes our chemistry feel stronger than usual?', subcategory: 'ATTRACTION', intimacyLevel: 'INTIMATE' },
    { text: 'What turns you on about the way I look at you?', subcategory: 'ATTRACTION', intimacyLevel: 'INTIMATE' },

    // 🔥 Sexual Preferences
    { text: "What's your favourite kind of kiss?", subcategory: 'SEXUAL_PREFERENCES', intimacyLevel: 'FLIRTY' },
    {
      text: 'Do you prefer slow, romantic kisses or spontaneous, passionate ones?',
      subcategory: 'SEXUAL_PREFERENCES',
      intimacyLevel: 'FLIRTY',
      responseType: 'MULTIPLE_CHOICE',
      options: ['Slow and romantic', 'Spontaneous and passionate', 'Both, depending on the moment'],
    },
    { text: "What's your most memorable kiss with me?", subcategory: 'SEXUAL_PREFERENCES', intimacyLevel: 'ROMANTIC' },
    { text: 'Where would you love to have a romantic kiss?', subcategory: 'SEXUAL_PREFERENCES', intimacyLevel: 'ROMANTIC' },
    { text: 'What makes a kiss unforgettable for you?', subcategory: 'SEXUAL_PREFERENCES', intimacyLevel: 'FLIRTY' },
    {
      text: "Do you prefer intimacy that's slow and drawn out, or quick and spontaneous?",
      subcategory: 'SEXUAL_PREFERENCES',
      intimacyLevel: 'INTIMATE',
      responseType: 'MULTIPLE_CHOICE',
      options: ['Slow and drawn out', 'Quick and spontaneous', 'Depends on the mood'],
    },
    {
      text: 'Do you enjoy giving affection more, receiving it more, or equally both?',
      subcategory: 'SEXUAL_PREFERENCES',
      intimacyLevel: 'INTIMATE',
      responseType: 'MULTIPLE_CHOICE',
      options: ['Giving', 'Receiving', 'Equally both'],
    },
    {
      text: 'Do you lean more romantic and gentle, or a little rough and passionate?',
      subcategory: 'SEXUAL_PREFERENCES',
      intimacyLevel: 'INTIMATE',
      responseType: 'MULTIPLE_CHOICE',
      options: ['Romantic and gentle', 'Rough and passionate', 'A mix of both'],
    },
    {
      text: 'Do you prefer the lights on or off during intimate moments?',
      subcategory: 'SEXUAL_PREFERENCES',
      intimacyLevel: 'INTIMATE',
      responseType: 'MULTIPLE_CHOICE',
      options: ['Lights on', 'Lights off', 'Depends on my mood'],
    },
    { text: 'How do you feel about maintaining eye contact during intimate moments?', subcategory: 'SEXUAL_PREFERENCES', intimacyLevel: 'INTIMATE' },
    { text: "What's your honest take on dirty talk?", subcategory: 'SEXUAL_PREFERENCES', intimacyLevel: 'INTIMATE' },
    {
      text: 'Are you comfortable with sexting between us?',
      subcategory: 'SEXUAL_PREFERENCES',
      intimacyLevel: 'INTIMATE',
      responseType: 'YES_NO',
    },
    { text: 'What kind of foreplay do you enjoy most?', subcategory: 'SEXUAL_PREFERENCES', intimacyLevel: 'INTIMATE' },
    {
      text: 'Do you prefer taking control, being led, or a mix of both?',
      subcategory: 'SEXUAL_PREFERENCES',
      intimacyLevel: 'INTIMATE',
      responseType: 'MULTIPLE_CHOICE',
      options: ['Taking control', 'Being led', 'A mix of both'],
    },
    { text: 'What time of day do you feel most in the mood?', subcategory: 'SEXUAL_PREFERENCES', intimacyLevel: 'FLIRTY' },

    // 👀 Turn-Ons
    { text: "What's something I do that you find unexpectedly attractive?", subcategory: 'TURN_ONS', intimacyLevel: 'FLIRTY' },
    { text: "What's your biggest romantic turn-on?", subcategory: 'TURN_ONS', intimacyLevel: 'FLIRTY' },
    { text: 'What kind of compliments affect you the most?', subcategory: 'TURN_ONS', intimacyLevel: 'ROMANTIC' },
    { text: "What's something I could do that would make you blush instantly?", subcategory: 'TURN_ONS', intimacyLevel: 'FLIRTY' },
    { text: "What's your favourite kind of flirting?", subcategory: 'TURN_ONS', intimacyLevel: 'FLIRTY' },

    // 😈 Fantasies & Curiosity
    { text: "What's a romantic fantasy you've always wanted to share?", subcategory: 'FANTASIES_CURIOSITY', intimacyLevel: 'DEEPLY_PERSONAL' },
    { text: "What's something adventurous you'd be curious to experience together?", subcategory: 'FANTASIES_CURIOSITY', intimacyLevel: 'INTIMATE' },
    { text: "What's your idea of an unforgettable romantic night?", subcategory: 'FANTASIES_CURIOSITY', intimacyLevel: 'ROMANTIC' },
    { text: "Is there a new romantic experience you'd like us to try?", subcategory: 'FANTASIES_CURIOSITY', intimacyLevel: 'INTIMATE' },
    {
      text: "What's something you've imagined us doing together but never told me?",
      subcategory: 'FANTASIES_CURIOSITY',
      intimacyLevel: 'DEEPLY_PERSONAL',
    },
    {
      text: "Do you have a role-play scenario you'd be curious to try together?",
      subcategory: 'FANTASIES_CURIOSITY',
      intimacyLevel: 'DEEPLY_PERSONAL',
    },
    { text: "Is there something you're curious about but have never brought up?", subcategory: 'FANTASIES_CURIOSITY', intimacyLevel: 'DEEPLY_PERSONAL' },
    {
      text: "Is there something you'd only ever fantasize about, never actually try?",
      subcategory: 'FANTASIES_CURIOSITY',
      intimacyLevel: 'DEEPLY_PERSONAL',
    },
    { text: "Is there a place you've fantasized about being intimate together?", subcategory: 'FANTASIES_CURIOSITY', intimacyLevel: 'INTIMATE' },

    // 💭 Personal Experience
    {
      text: 'Looking back, what stands out most about your first intimate relationship?',
      subcategory: 'PERSONAL_EXPERIENCE',
      intimacyLevel: 'DEEPLY_PERSONAL',
    },
    { text: "What's the most memorable intimate experience you've had?", subcategory: 'PERSONAL_EXPERIENCE', intimacyLevel: 'DEEPLY_PERSONAL' },
    {
      text: "What's the most embarrassing intimate moment you can laugh about now?",
      subcategory: 'PERSONAL_EXPERIENCE',
      intimacyLevel: 'DEEPLY_PERSONAL',
    },
    { text: 'How have your preferences changed over time?', subcategory: 'PERSONAL_EXPERIENCE', intimacyLevel: 'DEEPLY_PERSONAL' },
    { text: 'Was there a past crush that taught you something about what you want?', subcategory: 'PERSONAL_EXPERIENCE', intimacyLevel: 'DEEPLY_PERSONAL' },
    { text: 'Do you ever remember your dreams being romantic or intimate?', subcategory: 'PERSONAL_EXPERIENCE', intimacyLevel: 'DEEPLY_PERSONAL' },
    { text: "What's an intimate memory that still makes you smile?", subcategory: 'PERSONAL_EXPERIENCE', intimacyLevel: 'INTIMATE' },
    {
      text: "What's something about your past relationships you're glad is different with us?",
      subcategory: 'PERSONAL_EXPERIENCE',
      intimacyLevel: 'DEEPLY_PERSONAL',
    },

    // 🛏️ Intimacy & Relationship
    { text: 'What makes you feel closest to me?', subcategory: 'INTIMACY_RELATIONSHIP', intimacyLevel: 'ROMANTIC' },
    { text: 'What kind of affection makes you feel most loved?', subcategory: 'INTIMACY_RELATIONSHIP', intimacyLevel: 'ROMANTIC' },
    {
      text: "What's something intimate you've always wanted to talk about?",
      subcategory: 'INTIMACY_RELATIONSHIP',
      intimacyLevel: 'DEEPLY_PERSONAL',
    },
    { text: "What's your idea of a perfect private evening together?", subcategory: 'INTIMACY_RELATIONSHIP', intimacyLevel: 'ROMANTIC' },
    {
      text: 'What makes you feel comfortable enough to be completely yourself with me?',
      subcategory: 'INTIMACY_RELATIONSHIP',
      intimacyLevel: 'ROMANTIC',
    },
    { text: 'What makes you feel emotionally connected during intimate moments?', subcategory: 'INTIMACY_RELATIONSHIP', intimacyLevel: 'INTIMATE' },
    {
      text: 'How can I better support what you need to feel close to me?',
      subcategory: 'INTIMACY_RELATIONSHIP',
      intimacyLevel: 'DEEPLY_PERSONAL',
    },
    { text: 'What is your ideal frequency for intimacy between us?', subcategory: 'INTIMACY_RELATIONSHIP', intimacyLevel: 'DEEPLY_PERSONAL' },
    {
      text: 'What makes intimacy feel meaningful to you, beyond the physical?',
      subcategory: 'INTIMACY_RELATIONSHIP',
      intimacyLevel: 'INTIMATE',
    },
    { text: 'How do you like affection expressed outside of intimate moments?', subcategory: 'INTIMACY_RELATIONSHIP', intimacyLevel: 'ROMANTIC' },

    // 🔐 Boundaries & Consent
    { text: "What's something you absolutely love in a relationship?", subcategory: 'BOUNDARIES_PREFERENCES', intimacyLevel: 'ROMANTIC' },
    { text: "What's something you'd never be comfortable with?", subcategory: 'BOUNDARIES_PREFERENCES', intimacyLevel: 'DEEPLY_PERSONAL' },
    { text: 'How do you prefer to communicate your boundaries?', subcategory: 'BOUNDARIES_PREFERENCES', intimacyLevel: 'DEEPLY_PERSONAL' },
    {
      text: 'What makes you feel safe and comfortable during intimate moments?',
      subcategory: 'BOUNDARIES_PREFERENCES',
      intimacyLevel: 'DEEPLY_PERSONAL',
    },
    {
      text: "Is there anything you'd like me to ask before trying something new?",
      subcategory: 'BOUNDARIES_PREFERENCES',
      intimacyLevel: 'DEEPLY_PERSONAL',
    },
    { text: "Is there anything that's completely off-limits for you?", subcategory: 'BOUNDARIES_PREFERENCES', intimacyLevel: 'DEEPLY_PERSONAL' },
    { text: 'What helps you feel comfortable trying something new?', subcategory: 'BOUNDARIES_PREFERENCES', intimacyLevel: 'DEEPLY_PERSONAL' },
    {
      text: "What's something you'd never want to feel pressured into?",
      subcategory: 'BOUNDARIES_PREFERENCES',
      intimacyLevel: 'DEEPLY_PERSONAL',
    },
    { text: 'What makes you feel respected during intimate moments?', subcategory: 'BOUNDARIES_PREFERENCES', intimacyLevel: 'DEEPLY_PERSONAL' },
    {
      text: 'How should we communicate if either of us wants to stop?',
      subcategory: 'BOUNDARIES_PREFERENCES',
      intimacyLevel: 'DEEPLY_PERSONAL',
    },

    // 🥰 Couple Confessions
    { text: "What's something you've wanted to tell me but were too shy to say?", subcategory: 'COUPLE_CONFESSIONS', intimacyLevel: 'DEEPLY_PERSONAL' },
    { text: 'What is one secret crush-like thought you have had about me?', subcategory: 'COUPLE_CONFESSIONS', intimacyLevel: 'DEEPLY_PERSONAL' },
    { text: 'When did you first realise you were attracted to me?', subcategory: 'COUPLE_CONFESSIONS', intimacyLevel: 'ROMANTIC' },
    { text: "What's something about me that makes you lose your words?", subcategory: 'COUPLE_CONFESSIONS', intimacyLevel: 'FLIRTY' },
    { text: "What's one thing you secretly hope I do more often?", subcategory: 'COUPLE_CONFESSIONS', intimacyLevel: 'DEEPLY_PERSONAL' },

    // 😏 Flirty Couple Questions
    { text: "What's something I do that always puts you in the mood?", subcategory: 'FLIRTY_COUPLE', intimacyLevel: 'FLIRTY' },
    { text: "What's your favourite way for me to show affection?", subcategory: 'FLIRTY_COUPLE', intimacyLevel: 'ROMANTIC' },
    { text: 'When do you feel most attracted to me?', subcategory: 'FLIRTY_COUPLE', intimacyLevel: 'FLIRTY' },
    { text: "What's one thing you wish I knew about what you like?", subcategory: 'FLIRTY_COUPLE', intimacyLevel: 'DEEPLY_PERSONAL' },
    { text: "What's something you've always wanted to ask me?", subcategory: 'FLIRTY_COUPLE', intimacyLevel: 'DEEPLY_PERSONAL' },
    { text: "What's something small I do that drives you crazy, in the best way?", subcategory: 'FLIRTY_COUPLE', intimacyLevel: 'FLIRTY' },
    { text: "What's a compliment from me you'd love to hear more often?", subcategory: 'FLIRTY_COUPLE', intimacyLevel: 'ROMANTIC' },
    { text: 'What is your favourite thing to whisper to each other?', subcategory: 'FLIRTY_COUPLE', intimacyLevel: 'FLIRTY' },

    // 🌶️ Personal Rating Questions (1–10 scale)
    { text: 'How would you rate our chemistry?', subcategory: 'PERSONAL_RATING', intimacyLevel: 'INTIMATE', responseType: 'SCALE_1_10' },
    {
      text: 'How adventurous are you when it comes to intimacy?',
      subcategory: 'PERSONAL_RATING',
      intimacyLevel: 'INTIMATE',
      responseType: 'SCALE_1_10',
    },
    {
      text: 'How comfortable are you talking about sexual preferences?',
      subcategory: 'PERSONAL_RATING',
      intimacyLevel: 'INTIMATE',
      responseType: 'SCALE_1_10',
    },
    { text: 'How important is physical intimacy to you?', subcategory: 'PERSONAL_RATING', intimacyLevel: 'INTIMATE', responseType: 'SCALE_1_10' },
    {
      text: 'How important is emotional connection during intimacy?',
      subcategory: 'PERSONAL_RATING',
      intimacyLevel: 'ROMANTIC',
      responseType: 'SCALE_1_10',
    },
    { text: 'How playful are you feeling today?', subcategory: 'PERSONAL_RATING', intimacyLevel: 'FLIRTY', responseType: 'SCALE_1_10' },
    {
      text: 'How open are you to a spontaneous romantic surprise from me?',
      subcategory: 'PERSONAL_RATING',
      intimacyLevel: 'FLIRTY',
      responseType: 'SCALE_1_10',
    },
  ],
  RANDOM: [
    'If we could teleport anywhere right now, where would we go?',
    'What is a skill you wish we could learn together?',
    'What is one thing on our bucket list we should do this year?',
    'If we started a business together, what would it be?',
    'What is your dream way for us to spend a rainy day?',
    'What song should be "our song" going forward?',
    'What is one tradition you want us to start?',
    'If we adopted a pet today, what would we name it?',
    'What is a random fact about you I might not know?',
    'What would our perfect Saturday look like?',
  ],
};

export function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function dailyDeterministic(list, date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return list[dayOfYear % list.length];
}
