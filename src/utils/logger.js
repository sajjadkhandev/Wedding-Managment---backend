// Console Logger with Timestamps and Levels

export const logger = {
  info: (msg, meta = '') => {
    console.log(`[INFO]  ${new Date().toISOString()} - ${msg}`, meta ? meta : '');
  },
  warn: (msg, meta = '') => {
    console.warn(`[WARN]  ${new Date().toISOString()} - ${msg}`, meta ? meta : '');
  },
  error: (msg, meta = '') => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, meta ? meta : '');
  },
  db: (msg) => {
    console.log(`[DB]    ${new Date().toISOString()} - ${msg}`);
  }
};

export default logger;
