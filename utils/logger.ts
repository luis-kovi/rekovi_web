// utils/logger.ts
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      logger.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (isDevelopment) {
      logger.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      logger.warn(...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      logger.debug(...args);
    }
  }
};

export default logger;
