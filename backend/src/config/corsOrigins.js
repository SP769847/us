const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function isOriginAllowed(origin) {
  if (!origin) return true; // same-origin / server-to-server / curl requests have no Origin header
  return allowedOrigins.includes(origin);
}

export function corsOriginHandler(origin, callback) {
  if (isOriginAllowed(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  }
}

export default allowedOrigins;
