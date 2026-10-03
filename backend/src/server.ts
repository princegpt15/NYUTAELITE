// src/server.ts
import http from 'http';
import app from './app.js';
import { env } from './config/env.js';

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT – shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM – shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
