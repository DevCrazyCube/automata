// utils/logger.js
// Lightweight structured logger used instead of bare console.log.
// Levels: debug / info / warn / error. Output format is human-readable
// with ISO timestamps so logs can be grepped after runs.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const CURRENT_LEVEL = LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] || LEVELS.info;

/**
 * Format a log entry consistently.
 * @param {string} level
 * @param {string} scope
 * @param {string} message
 * @param {object} [meta]
 */
function format(level, scope, message, meta) {
  const timestamp = new Date().toISOString();
  const tag = `[${timestamp}] [${level.toUpperCase()}] [${scope}]`;
  if (meta && Object.keys(meta).length > 0) {
    return `${tag} ${message} ${JSON.stringify(meta)}`;
  }
  return `${tag} ${message}`;
}

function write(level, scope, message, meta) {
  if (LEVELS[level] < CURRENT_LEVEL) return;
  const line = format(level, scope, message, meta);
  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

const logger = {
  debug: (scope, message, meta) => write('debug', scope, message, meta),
  info: (scope, message, meta) => write('info', scope, message, meta),
  warn: (scope, message, meta) => write('warn', scope, message, meta),
  error: (scope, message, meta) => write('error', scope, message, meta),

  /**
   * Emit a transaction log line on a socket and also persist to stdout.
   * @param {import('socket.io').Server} io
   * @param {object} tx - transaction payload
   */
  transaction(io, tx) {
    const payload = {
      ...tx,
      timestamp: tx.timestamp || new Date().toISOString()
    };
    io.emit('transaction_log', payload);
    write('info', 'tx', `${payload.type || 'transfer'} ${payload.from || '-'} → ${payload.to || '-'} ${payload.amount || 0} ${payload.asset || ''}`);
    return payload;
  }
};

module.exports = logger;
