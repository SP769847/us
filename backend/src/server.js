import 'dotenv/config';
import http from 'node:http';
import app from './app.js';
import { initSockets } from './sockets/index.js';

const PORT = process.env.PORT || 4000;
const httpServer = http.createServer(app);

initSockets(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
