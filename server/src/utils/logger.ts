import winston from 'winston';
import { config } from 'dotenv';

config();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error',
      dirname: 'logs' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log',
      dirname: 'logs' 
    })
  ]
});

// Ensure logs directory exists
import { mkdirSync } from 'fs';
try {
  mkdirSync('logs');
} catch (error) {
  // Directory already exists or cannot be created
  if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
    console.error('Could not create logs directory:', error);
  }
}

export default logger; 