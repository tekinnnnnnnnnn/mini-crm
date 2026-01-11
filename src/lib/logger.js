const { createLogger, transports, format } = require('winston');
const config = require('../config');

const isProd = config.app.env === 'production';

const devFormat = format.combine(
  format.colorize({ all: true }),
  format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaText = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    if (stack) return `${timestamp} [${level}] ${message} - ${stack}${metaText}`;
    return `${timestamp} [${level}] ${message}${metaText}`;
  })
);

const logger = createLogger({
  level: config.log.level,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    isProd ? format.json() : devFormat
  ),
  transports: [new transports.Console()]
});

module.exports = logger;
