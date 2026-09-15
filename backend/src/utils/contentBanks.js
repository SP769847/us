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

export function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function dailyDeterministic(list, date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return list[dayOfYear % list.length];
}
