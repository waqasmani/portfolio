/**
 * Minimal structured logger. Writes JSON lines in production (easy to ship to
 * any log collector) and readable lines in development.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

const isProd = process.env.NODE_ENV === 'production';

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  if (level === 'debug' && isProd) return;
  const entry = { level, message, time: new Date().toISOString(), ...meta };
  const line = isProd
    ? JSON.stringify(entry)
    : `[${level.toUpperCase()}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`;
  // eslint-disable-next-line no-console
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};
