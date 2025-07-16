const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
);

// Daily rotation transport
const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: 'logs/%DATE%.log',  // log files will be like 2024-04-26.log
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,           // old logs compressed
  maxSize: '20m',                // max log file size
  maxFiles: '14d'                // keep logs for 14 days
});

// Create logger
const logger = createLogger({
  level: 'info', // 'error', 'warn', 'info', 'debug'
  format: logFormat,
  transports: [
    new transports.Console(),   // log to console
    dailyRotateFileTransport    // log to rotating file
  ],
  exitOnError: false
});

module.exports = logger;