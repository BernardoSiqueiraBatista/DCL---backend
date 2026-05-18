import env from '../config/env.js';

// ─── ANSI Colors ──────────────────────────────────────────────────────────────
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';
const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE   = '\x1b[34m';
const CYAN   = '\x1b[36m';
const GRAY   = '\x1b[90m';

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 23);
}

function format(level, color, ...args) {
  const ts  = `${GRAY}${timestamp()}${RESET}`;
  const lvl = `${color}${BOLD}[${level.toUpperCase().padEnd(5)}]${RESET}`;
  return `${ts} ${lvl} ${args.join(' ')}`;
}

const logger = {
  info:  (...args) => console.log(format('info',  GREEN,  ...args)),
  warn:  (...args) => console.warn(format('warn',  YELLOW, ...args)),
  error: (...args) => console.error(format('error', RED,    ...args)),
  debug: (...args) => { if (env.isDev) console.log(format('debug', CYAN, DIM, ...args, RESET)); },
  http:  (...args) => console.log(format('http',  BLUE,   ...args)),
};

export default logger;
