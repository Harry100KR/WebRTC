import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import recordingsRouter from './routes/recordings';
import productsRouter from './routes/products';
import { setupWebRTC } from './services/webrtc';

// Type declarations for cookie-parser
declare module 'express-serve-static-core' {
  interface Request {
    cookies: any;
  }
}

config();

const app = express();
const server = http.createServer(app);

// Enhanced security for Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type']
  },
  connectTimeout: 10000,
  pingTimeout: 5000,
  pingInterval: 10000,
  transports: ['websocket', 'polling']
});

// Security middleware
if (process.env.ENABLE_HELMET === 'true') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'wss:', 'https:'],
        mediaSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        scriptSrc: ["'self'"],
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

// Routes
app.use('/api/recordings', recordingsRouter);
app.use('/api/products', productsRouter);

// WebRTC setup
setupWebRTC(io);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(Number(PORT), () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
}); 