import 'dotenv/config';
import http from 'node:http';
import app from './app.js';
import { initSockets } from './sockets/index.js';
import { seedQuestions } from './utils/seedQuestions.js';

const PORT = process.env.PORT || 4000;
const httpServer = http.createServer(app);

initSockets(httpServer);

seedQuestions()
  .then((count) => console.log(`Question bank ready (${count} questions).`))
  .catch((err) => console.error('Failed to seed question bank:', err));

httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
