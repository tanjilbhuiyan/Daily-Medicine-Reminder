/**
 * Security Configuration
 * 
 * Centralized security middleware and configuration
 */

import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cors from 'cors'

const NODE_ENV = process.env.NODE_ENV || 'development'

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false // Allow embedding for development
})

// Rate limiting configuration
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 500 : 10000, // More generous limits
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/api/health'
})

// CORS configuration
export const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://192.168.1.274:3000', 'http://localhost:3000']
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

export const corsMiddleware = cors(corsOptions)