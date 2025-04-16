import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { Server } from 'socket.io';
import { WebRTCService } from './services/webrtc';
import morgan from 'morgan';
import winston from 'winston';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

// Import routes
import productsRouter from './routes/products';
import watchlistRouter from './routes/watchlistRoutes';
import portfolioRouter from './routes/portfolioRoutes';
import recordingsRouter from './routes/recordings';

// Type declarations
declare module 'express' {
  interface Request {
    // cookies: any;
    user?: {
      id: number;
      email: string;
      role: string;
    };
  }
}

config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const webrtcService = new WebRTCService(io);

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Security middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'wss:', 'https:'],
        mediaSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"]
      }
    },
    hsts: process.env.ENABLE_HSTS === 'true',
    noSniff: process.env.ENABLE_NOSNIFF === 'true',
    frameguard: process.env.ENABLE_FRAME_GUARD === 'true' ? { action: 'deny' } : false,
    xssFilter: process.env.ENABLE_XSS_PROTECTION === 'true'
  }));
}

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86400 // 24 hours
}));

// Cookie security
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting configuration
const windowMs = process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 300000;
const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS ? Number(process.env.RATE_LIMIT_MAX_REQUESTS) : 50;

const limiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: { error: process.env.RATE_LIMIT_MESSAGE || 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Trust proxy if behind reverse proxy
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

// Configure routes with authentication
app.use('/api/products', authenticateToken, productsRouter);
app.use('/api/watchlist', authenticateToken, watchlistRouter);
app.use('/api/portfolio', authenticateToken, portfolioRouter);
app.use('/api/recordings', authenticateToken, recordingsRouter);

// Add WebRTC status endpoint
app.get('/api/webrtc/status', (req, res) => {
  res.json({
    activeRooms: webrtcService.getRoomCount(),
    status: 'healthy'
  });
});

// Error handling middleware
app.use(errorHandler(logger));

const PORT = process.env.PORT || 3001;
server.listen(Number(PORT), () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
}); 