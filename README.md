# Us — Private Couple Social & Chat Platform

A private, romantic social + chat platform: connection requests, real-time persistent messaging, love notes, secret messages, memories, a relationship timeline, couple games, daily questions, challenges, special-date countdowns, notifications, and an admin moderation panel.

## Stack

- **Backend**: Node.js, Express, Socket.IO, Prisma ORM, PostgreSQL
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, React Router, socket.io-client
- **Auth**: JWT in an httpOnly cookie, bcrypt password hashing
- **Storage**: local disk under `backend/uploads` (swap path to Supabase Storage documented below)

## Running locally

### 1. Database

```bash
docker compose up -d   # starts local Postgres on localhost:5432
```

No Docker? Point `DATABASE_URL` in `backend/.env` at any Postgres instance instead (a free Supabase or Neon project works fine for local dev too).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # then set JWT_SECRET to a random value
npm run prisma:migrate    # applies schema, prompts for a migration name the first time
npm run seed               # optional demo data
npm run dev                 # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173 (or next free port)
```

The Vite dev server proxies `/api`, `/uploads`, and `/socket.io` to `http://localhost:4000`, so no CORS setup or `VITE_API_URL` is needed in dev — leave it unset.

## Demo accounts (from `npm run seed`)

| Role  | Username    | Password    |
|-------|-------------|-------------|
| User  | demo_alex   | Demo1234!   |
| User  | demo_sam    | Demo1234!   |
| Admin | admin       | Admin1234!  |

Alex and Sam are already connected with sample messages, a love note, a memory, a timeline entry, and an upcoming special date.

---

## Deploying to production (Render + Vercel)

### Backend on Render

**Option A — Blueprint (fastest):** In the Render dashboard, choose **New > Blueprint**, point it at this GitHub repo, and it will read `render.yaml` at the repo root and create both the web service and a free Postgres database automatically. You'll be prompted for the one `sync: false` var (`CLIENT_URL`) — leave it blank for now, you'll set it after the frontend is deployed (step below).

**Option B — Manual:**
1. **New > PostgreSQL** — create a free Postgres instance, note its **Internal Database URL**.
2. **New > Web Service** — connect this repo, set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. Add environment variables on the web service:
   - `DATABASE_URL` — the Internal Database URL from step 1
   - `JWT_SECRET` — a long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `JWT_EXPIRES_IN` — `7d`
   - `NODE_ENV` — `production`
   - `CLIENT_URL` — your Vercel URL once you have it (e.g. `https://your-app.vercel.app`) — comma-separate multiple origins if you later add a custom domain
4. Deploy. Once live, note the backend's public URL (e.g. `https://us-backend.onrender.com`).
5. Optionally run `npm run seed` via Render's Shell tab if you want demo data in production.

### Frontend on Vercel

1. **Add New > Project**, import this repo.
2. Set **Root Directory** to `frontend` (Vercel auto-detects the Vite framework once you do).
3. Add an environment variable: `VITE_API_URL` = your Render backend URL from above, **no trailing slash** (e.g. `https://us-backend.onrender.com`).
4. Deploy. Vercel gives you a `https://your-app.vercel.app` URL.
5. Go back to Render and set the backend's `CLIENT_URL` env var to that exact Vercel URL, then redeploy the backend (or it'll auto-redeploy on env var save).

### Verify

Visit your Vercel URL, sign up, and confirm login/chat/notifications work. Open the browser devtools Network tab if login seems to silently fail — that almost always means `CLIENT_URL` (backend) and `VITE_API_URL` (frontend) don't exactly match what the other side expects (protocol, trailing slash, or wrong URL).

### Production caveats specific to this stack

- **Uploads are ephemeral on Render's free plan.** Local-disk files (avatars, chat images, memory/timeline photos) are wiped on every redeploy and instance restart. Fine for testing; before real users rely on uploaded photos, switch `backend/src/utils/upload.js` to Supabase Storage (or S3) — ask me and I'll wire it up.
- **Render's free Postgres is deleted after 90 days** of the free tier's lifetime. Upgrade to a paid instance (or migrate to Supabase) before that matters to you.
- **Cold starts:** Render's free web service spins down after ~15 minutes idle. The first request after that takes 30–60s to wake up, and any open Socket.IO connections drop and reconnect automatically — expect a brief delay on the first message after a quiet period.
- **Cross-domain cookies:** since Vercel and Render are different domains, the auth cookie is set with `sameSite: "none"; secure: true` in production (already handled in `auth.controller.js`). This requires HTTPS on both ends, which both platforms provide by default — don't route through plain HTTP.

### Moving off Render/Vercel later (e.g. to Supabase for the DB)

1. In `backend/prisma/schema.prisma`, `datasource.url` already reads from `DATABASE_URL` — just point it at your Supabase connection string (Project Settings > Database) and re-run `npm run prisma:migrate` (or `prisma migrate deploy` in CI).
2. Swap `backend/src/utils/upload.js`'s disk storage for Supabase Storage using the `SUPABASE_*` env vars already scaffolded in `.env.example`.

---

## Security notes

- Every conversation/message/love-note/secret-message/memory endpoint verifies the requesting user is a participant or owner server-side — IDs in the URL cannot be used to read another user's private data (verified: a non-member gets a 403).
- Passwords are hashed with bcrypt; secret-message passcodes are hashed too, never stored in plaintext.
- Rate limiting is applied to auth routes and the API as a whole.
- No email provider is configured, so password-reset links are logged to the server console and returned in the API response only when `NODE_ENV !== "production"` — wire up a real mail provider (Resend, Postmark, SES) before relying on password reset in production.

## Known limitations

- No automated test suite was added (manual + Playwright-driven verification was performed instead).
- File storage is local disk — ephemeral on most PaaS hosts (see Render caveat above). Switch to Supabase Storage/S3 for real production use.
- Socket.IO runs in-process; for horizontal scaling (more than one backend instance) add the Redis adapter (`@socket.io/redis-adapter`) so real-time events reach users connected to a different instance.
