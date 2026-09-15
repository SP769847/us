# Us — Private Couple Social & Chat Platform

A private, romantic social + chat platform: connection requests, real-time persistent messaging, love notes, secret messages, memories, a relationship timeline, couple games, daily questions, challenges, special-date countdowns, notifications, and an admin moderation panel.

## Stack

- **Backend**: Node.js, Express, Socket.IO, Prisma ORM
- **Database**: MySQL wire protocol — [TiDB Cloud](https://tidbcloud.com) in production, local MySQL for dev
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, React Router, socket.io-client
- **Auth**: JWT in an httpOnly cookie, bcrypt password hashing
- **Storage**: local disk under `backend/uploads` (swap path to Supabase Storage documented below)

## Running locally

### 1. Database

```bash
docker compose up -d   # starts local MySQL on localhost:3306
```

No Docker? Point `DATABASE_URL` in `backend/.env` at any MySQL 8 instance instead — or just use your TiDB Cloud cluster for local dev too, it's the same connection string format.

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

## Deploying to production (TiDB Cloud + Render + Vercel)

### 1. Database on TiDB Cloud

1. Go to https://tidbcloud.com and sign up / log in.
2. Create a **Serverless** cluster (free tier — no credit card required for the base tier). Pick a region close to your Render backend's region.
3. Once it's provisioned, click **Connect** on the cluster.
4. Choose connection type **General** (or **Prisma** if TiDB Cloud offers a Prisma-specific preset — same result either way) and generate/reveal a password.
5. Copy the connection string. It looks like:
   ```
   mysql://<user>.root:<password>@<host>:4000/<database>?sslaccept=strict
   ```
   Keep the `?sslaccept=strict` — TiDB Cloud requires TLS, and its certs are publicly trusted so no separate CA file is needed.
6. Create a database name (e.g. `us_prod`) if the console asks, or just append it to the connection string's path.

You now have your production `DATABASE_URL`. You don't need to run migrations manually — Render's build step does that automatically (see below).

### 2. Backend on Render

**Option A — Blueprint (fastest):** In the Render dashboard, choose **New > Blueprint**, point it at this GitHub repo. It reads `render.yaml` at the repo root and creates the web service. You'll be prompted for two `sync: false` vars:
   - `DATABASE_URL` — paste the TiDB Cloud connection string from step 1
   - `CLIENT_URL` — leave blank / a placeholder for now, you'll set it after Vercel is deployed

**Option B — Manual:**
1. **New > Web Service** — connect this repo, set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
2. Add environment variables:
   - `DATABASE_URL` — your TiDB Cloud connection string from step 1
   - `JWT_SECRET` — a long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `JWT_EXPIRES_IN` — `7d`
   - `NODE_ENV` — `production`
   - `CLIENT_URL` — your Vercel URL once you have it (e.g. `https://your-app.vercel.app`) — comma-separate multiple origins if you later add a custom domain

Either way: watch the **Logs** tab on first deploy. `npm run build` runs `prisma generate && prisma migrate deploy`, which creates every table on your empty TiDB database — you should see `Applying migration ...` lines followed by the server starting. Once live, note the backend's public URL (e.g. `https://us-backend.onrender.com`).

Optionally run `npm run seed` via Render's **Shell** tab if you want demo data in production.

### 3. Frontend on Vercel

1. **Add New > Project**, import this repo.
2. Set **Root Directory** to `frontend` (Vercel auto-detects the Vite framework once you do).
3. Add an environment variable: `VITE_API_URL` = your Render backend URL from above, **no trailing slash** (e.g. `https://us-backend.onrender.com`).
4. Deploy. Vercel gives you a `https://your-app.vercel.app` URL.
5. Go back to Render and set the backend's `CLIENT_URL` env var to that exact Vercel URL, then redeploy the backend (or it'll auto-redeploy on env var save).

### Verify

Visit your Vercel URL, sign up, and confirm login/chat/notifications work. Open the browser devtools Network tab if login seems to silently fail — that almost always means `CLIENT_URL` (backend) and `VITE_API_URL` (frontend) don't exactly match what the other side expects (protocol, trailing slash, or wrong URL). If signup returns a `500`, check Render's Logs tab first — it's almost always a `DATABASE_URL` issue (wrong password, missing `?sslaccept=strict`, or the database name doesn't exist yet).

### Production caveats specific to this stack

- **Uploads are ephemeral on Render's free plan.** Local-disk files (avatars, chat images, memory/timeline photos) are wiped on every redeploy and instance restart. Fine for testing; before real users rely on uploaded photos, switch `backend/src/utils/upload.js` to Supabase Storage (or S3) — ask me and I'll wire it up.
- **Cold starts:** Render's free web service spins down after ~15 minutes idle. The first request after that takes 30–60s to wake up, and any open Socket.IO connections drop and reconnect automatically — expect a brief delay on the first message after a quiet period.
- **Cross-domain cookies:** since Vercel and Render are different domains, the auth cookie is set with `sameSite: "none"; secure: true` in production (already handled in `auth.controller.js`). This requires HTTPS on both ends, which both platforms provide by default — don't route through plain HTTP.
- **Search case-sensitivity:** `contains` filters (Discover search, admin user search, in-chat message search) rely on the database column's default collation for case-insensitivity. TiDB's defaults are usually fine; if search ever feels case-sensitive in practice, the fix is altering the affected column's collation to a `_ci` variant, not a Prisma-side change (Prisma's `mode: "insensitive"` filter argument only works on Postgres/MongoDB, not MySQL/TiDB).

### Moving databases later

`backend/prisma/schema.prisma`'s `datasource.url` always reads from `DATABASE_URL`, so switching to a different MySQL-compatible host (PlanetScale, a self-hosted MySQL, etc.) is just a connection-string swap + `prisma migrate deploy`. Moving to Postgres/Supabase instead would require changing `provider = "mysql"` back to `"postgresql"`, removing `relationMode = "prisma"` (native FKs work fine on Postgres), and re-generating migrations from scratch.

---

## Security notes

- Every conversation/message/love-note/secret-message/memory endpoint verifies the requesting user is a participant or owner server-side — IDs in the URL cannot be used to read another user's private data (verified: a non-member gets a 403).
- Passwords are hashed with bcrypt; secret-message passcodes are hashed too, never stored in plaintext.
- Rate limiting is applied to auth routes and the API as a whole.
- No email provider is configured, so password-reset links are logged to the server console and returned in the API response only when `NODE_ENV !== "production"` — wire up a real mail provider (Resend, Postmark, SES) before relying on password reset in production.

## Known limitations

- No automated test suite was added (manual + Playwright-driven verification was performed instead).
- File storage is local disk — ephemeral on most PaaS hosts (see Render caveat above). Switch to Supabase Storage/S3 for real production use.
- `relationMode = "prisma"` means referential integrity (cascading deletes, etc.) is enforced by Prisma at the application layer rather than the database — fine as long as all writes go through this backend, but a concern if you ever let another service write to the same database directly.
- Socket.IO runs in-process; for horizontal scaling (more than one backend instance) add the Redis adapter (`@socket.io/redis-adapter`) so real-time events reach users connected to a different instance.
