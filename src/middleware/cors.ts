import cors from 'cors'
import { env } from '@/config/env'
import logger from '@/utils/logger'

// Parse allowed origins from environment variable
const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim())

logger.info('CORS allowed origins:', allowedOrigins)

/**
 * CORS configuration options
 */
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true)
    } else {
      logger.warn(`Blocked CORS request from origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours - how long to cache preflight requests
  optionsSuccessStatus: 200,
}

/**
 * CORS middleware with configured options
 */
export const corsMiddleware = cors(corsOptions)
