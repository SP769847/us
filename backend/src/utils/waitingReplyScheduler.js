import { runWaitingReplyScheduler } from '../services/waitingReply.js';

const POLL_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes, per spec (10-15 min)

export function startWaitingReplyScheduler() {
  const tick = async () => {
    try {
      const sent = await runWaitingReplyScheduler();
      if (sent > 0) console.log(`Waiting-reply scheduler sent ${sent} reminder(s).`);
    } catch (err) {
      console.error('Waiting-reply scheduler tick failed:', err);
    }
  };

  tick();
  return setInterval(tick, POLL_INTERVAL_MS);
}
