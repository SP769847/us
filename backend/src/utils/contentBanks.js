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
    "What's something about me that you find irresistible?",
    "What's your idea of the perfect romantic night together?",
    "What's one thing that instantly increases the chemistry between us?",
    "What's your favourite kind of kiss?",
    "What's a romantic fantasy you've always wanted to share?",
    "What's something new you'd be curious to experience together?",
    "What's the most attractive thing I do without realizing it?",
    "What's one place where you'd love to have a romantic date with me?",
    'How would you describe our chemistry in three words?',
    "What's something you've secretly wanted me to ask you?",
    'What outfit of mine do you find the most attractive?',
    "What's one compliment you love hearing from me in the moment?",
    'What makes you feel most desired by me?',
    "What's a slow, romantic evening you'd love us to plan?",
    'What small gesture from me makes you melt every time?',
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
