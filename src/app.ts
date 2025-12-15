import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { corsMiddleware } from '@/middleware/cors'
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler'
import { generalLimiter } from '@/middleware/rateLimiter'
import { sanitizeBody } from '@/middleware/validation'
import routes from '@/routes'
import logger from '@/utils/logger'

const app: Application = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}))

// CORS
app.use(corsMiddleware)

// Request parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Input sanitization
app.use(sanitizeBody)

// Compression
app.use(compression())

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  )
}

// Rate limiting
app.use(generalLimiter)

// API routes
app.use('/api/v1', routes)

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CostSense Budget Coach API',
    version: '1.0.0',
    documentation: '/api/v1/health',
  })
})

// 404 handler
app.use(notFoundHandler)

// Error handler (must be last)
app.use(errorHandler)

export default app
