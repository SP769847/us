// Thin re-export for backward compatibility — the real implementation now
// lives in services/notifications/index.js (the NotificationService), which
// additionally fans out to Email/WhatsApp based on recipient preferences.
// Every existing call site (connections, messages, love notes, challenges,
// games, daily questions, secret messages, surprise questions) keeps working
// unchanged since the signature is a strict superset of the original.
export { createNotification } from './notifications/index.js';
