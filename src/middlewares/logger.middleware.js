import logger from '../utils/logger.js';

export default function loggerMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status   = res.statusCode;
    const color    = status >= 500 ? '31' : status >= 400 ? '33' : status >= 300 ? '36' : '32';

    logger.http(
      `${req.method.padEnd(7)} ${req.originalUrl.padEnd(40)} \x1b[${color}m${status}\x1b[0m ${duration}ms`
    );
  });

  next();
}
