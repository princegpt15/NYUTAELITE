// backend/src/server.ts
import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorMonitor } from './services/errorMonitor.service.js';

const server = http.createServer(app);

server.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT}`, {
    port: env.PORT,
    environment: env.NODE_ENV,
    nodeVersion: process.version,
    pid: process.pid,
  });
});

// Process-level uncaught exception handler
process.on('uncaughtException', (err: Error) => {
  logger.error('[CRITICAL] Uncaught Exception encountered', {
    error: err.message,
    name: err.name,
    stack: err.stack,
  });
  errorMonitor.captureException(err, { source: 'uncaughtException' });

  // In production, give server brief moment to flush logs then exit cleanly
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Process-level unhandled promise rejection handler
process.on('unhandledRejection', (reason: any) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;

  logger.error('[CRITICAL] Unhandled Promise Rejection encountered', {
    message,
    stack,
  });
  errorMonitor.captureMessage(`Unhandled Rejection: ${message}`, 'error', { source: 'unhandledRejection' });
});

// Graceful shutdown on SIGINT
process.on('SIGINT', () => {
  logger.info('Received SIGINT – shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM – shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
