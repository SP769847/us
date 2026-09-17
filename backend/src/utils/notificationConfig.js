// Centralized, configurable cooldown/delay values (see .env.example) so the
// controller, service, and background scheduler never disagree on the rules.
export const missYouCooldownHours = () => Number(process.env.MISS_YOU_COOLDOWN_HOURS) || 6;
export const waitingReplyDelayHours = () => Number(process.env.WAITING_REPLY_DELAY_HOURS) || 3;
export const waitingReplyCooldownHours = () => Number(process.env.WAITING_REPLY_COOLDOWN_HOURS) || 12;

export function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}
