import winston from 'winston';
import path from 'path';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const logFilePath = process.env.LOG_FILE_PATH || 'logs/app.log';
const logDir = path.dirname(logFilePath);

// Create logs directory if it doesn't exist
require('fs').mkdirSync(logDir, { recursive: true });

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
  }),
  new winston.transports.File({
    filename: logFilePath,
  }),
];

const Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format,
  transports,
});

// Create a stream object for Morgan middleware
export const stream = {
  write: (message: string) => {
    Logger.info(message.trim());
  },
};

// Custom logging functions
export const logWebRTCEvent = (event: string, data: any) => {
  Logger.info(`WebRTC Event - ${event}: ${JSON.stringify(data)}`);
};

export const logDatabaseQuery = (query: string, params: any[] = []) => {
  Logger.debug(`Database Query: ${query} - Parameters: ${JSON.stringify(params)}`);
};

export const logSecurityEvent = (event: string, details: any) => {
  Logger.warn(`Security Event - ${event}: ${JSON.stringify(details)}`);
};

export const logMediaOperation = (operation: string, details: any) => {
  Logger.info(`Media Operation - ${operation}: ${JSON.stringify(details)}`);
};

export const logPerformanceMetric = (metric: string, value: number, unit: string) => {
  Logger.info(`Performance Metric - ${metric}: ${value}${unit}`);
};

// Error logging with stack traces
export const logError = (error: Error, context: string = '') => {
  Logger.error(`Error in ${context}: ${error.message}\nStack: ${error.stack}`);
};

export default Logger; 