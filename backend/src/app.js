import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { apiLimiter } from './middleware/rateLimiters.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { UPLOADS_DIR } from './utils/upload.js';
import { corsOriginHandler } from './config/corsOrigins.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import connectionsRoutes from './routes/connections.routes.js';
import moderationRoutes from './routes/moderation.routes.js';
import conversationsRoutes from './routes/conversations.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import loveNotesRoutes from './routes/loveNotes.routes.js';
import secretMessagesRoutes from './routes/secretMessages.routes.js';
import dailyQuestionsRoutes from './routes/dailyQuestions.routes.js';
import questionsRoutes from './routes/questions.routes.js';
import challengesRoutes from './routes/challenges.routes.js';
import gamesRoutes from './routes/games.routes.js';
import memoriesRoutes from './routes/memories.routes.js';
import timelineRoutes from './routes/timeline.routes.js';
import specialDatesRoutes from './routes/specialDates.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import surpriseRoutes from './routes/surprise.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import adminRoutes from './routes/admin.routes.js';
import missYouRoutes from './routes/missYou.routes.js';
import waitingReplyRoutes from './routes/waitingReply.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Render/Heroku-style hosts sit behind a reverse proxy — this is required for
// secure cookies and rate-limiting to correctly see the real client protocol/IP.
app.set('trust proxy', 1);

app.use(cors({ origin: corsOriginHandler, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/love-notes', loveNotesRoutes);
app.use('/api/secret-messages', secretMessagesRoutes);
app.use('/api/daily-questions', dailyQuestionsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/special-dates', specialDatesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/surprise-me', surpriseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/miss-you', missYouRoutes);
app.use('/api/waiting-reply', waitingReplyRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
