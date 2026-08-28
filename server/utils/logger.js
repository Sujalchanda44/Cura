/**
 * Formatted Application Logger
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (msg, meta = '') => {
    console.log(`${colors.cyan}[INFO]${colors.reset} [${getTimestamp()}] ${msg}`, meta ? meta : '');
  },
  success: (msg, meta = '') => {
    console.log(`${colors.green}[SUCCESS]${colors.reset} [${getTimestamp()}] ${msg}`, meta ? meta : '');
  },
  warn: (msg, meta = '') => {
    console.warn(`${colors.yellow}[WARN]${colors.reset} [${getTimestamp()}] ${msg}`, meta ? meta : '');
  },
  error: (msg, error = '') => {
    console.error(`${colors.red}[ERROR]${colors.reset} [${getTimestamp()}] ${msg}`, error ? error : '');
  },
  debug: (msg, meta = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${colors.magenta}[DEBUG]${colors.reset} [${getTimestamp()}] ${msg}`, meta ? meta : '');
    }
  }
};

module.exports = logger;
