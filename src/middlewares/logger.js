import morgan from 'morgan';
import pino from 'pino';

/**
 * Pino logger instance
 * Development'da pretty print, production'da JSON
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

/**
 * Morgan HTTP logger middleware
 * Combined format: standart Apache format
 */
export const httpLogger = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});
