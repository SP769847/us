import { deliverDueCustomQuestions } from '../controllers/questions.controller.js';

const POLL_INTERVAL_MS = 60 * 1000;

// No external job queue exists in this app — a simple in-process poll is
// enough at this scale (single instance, a handful of scheduled questions).
export function startCustomQuestionScheduler() {
  const tick = async () => {
    try {
      await deliverDueCustomQuestions();
    } catch (err) {
      console.error('Custom question scheduler tick failed:', err);
    }
  };

  tick();
  return setInterval(tick, POLL_INTERVAL_MS);
}
