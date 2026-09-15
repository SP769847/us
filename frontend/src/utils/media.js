const MEDIA_BASE = import.meta.env.VITE_API_URL || '';

// Uploaded files (avatars, chat images, memory/timeline photos) come back from
// the API as relative paths like "/uploads/avatars/x.jpg". In dev that resolves
// fine against the Vite proxy, but in production the frontend and backend are
// on different domains, so relative paths must be prefixed with the backend's
// origin. Leaves absolute URLs (http/https/blob/data — e.g. local file
// previews) untouched.
export function mediaUrl(path) {
  if (!path) return path;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${MEDIA_BASE}${path}`;
}
