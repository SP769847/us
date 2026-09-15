# Us — Private Couple Social & Chat Platform

A private, romantic social + chat platform: connection requests, real-time persistent messaging, love notes, secret messages, memories, a relationship timeline, couple games, daily questions, challenges, special-date countdowns, notifications, and an admin moderation panel.

## Stack

- **Backend**: Node.js, Express, Socket.IO, Prisma ORM, SQLite (dev) — schema is Postgres-ready
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, React Router, socket.io-client
- **Auth**: JWT in an httpOnly cookie, bcrypt password hashing
- **Storage**: local disk under `backend/uploads` (swap path to Supabase Storage documented in `backend/.env.example`)

## Running locally

### Backend

```bash
cd backend
npm install
npm run prisma:migrate   # creates dev.db and applies schema (already done once)
npm run seed             # optional demo data
npm run dev              # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173 (or next free port)
```

The Vite dev server proxies `/api`, `/uploads`, and `/socket.io` to `http://localhost:4000`, so no CORS setup is needed in dev.

## Demo accounts (from `npm run seed`)

| Role  | Username    | Password    |
|-------|-------------|-------------|
| User  | demo_alex   | Demo1234!   |
| User  | demo_sam    | Demo1234!   |
| Admin | admin       | Admin1234!  |

Alex and Sam are already connected with sample messages, a love note, a memory, a timeline entry, and an upcoming special date.

## Moving to Postgres/Supabase

1. In `backend/prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
2. Set `DATABASE_URL` in `backend/.env` to your Supabase connection string.
3. Run `npm run prisma:migrate` again.
4. Swap the local-disk upload logic in `backend/src/utils/upload.js` for Supabase Storage if you want object storage instead of the local `uploads/` folder.

## Security notes

- Every conversation/message/love-note/secret-message/memory endpoint verifies the requesting user is a participant or owner server-side — IDs in the URL cannot be used to read another user's private data (verified: a non-member gets a 403).
- Passwords are hashed with bcrypt; secret-message passcodes are hashed too, never stored in plaintext.
- Rate limiting is applied to auth routes and the API as a whole.
- No email provider is configured, so password-reset links are logged to the server console and returned in the API response only when `NODE_ENV !== "production"` — wire up a real mail provider before shipping.

## Known limitations

- No automated test suite was added (manual + Playwright-driven verification was performed instead).
- File storage is local disk, fine for a single dev server but not for a multi-instance deployment — switch to Supabase Storage/S3 for production.
- Socket.IO runs in-process; for horizontal scaling add the Redis adapter.
