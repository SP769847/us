const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Emails embed user-controlled text (display names) directly into HTML —
// this must always be escaped first to avoid HTML/markup injection.
export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}
