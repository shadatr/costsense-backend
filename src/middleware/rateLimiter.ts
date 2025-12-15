import rateLimit from 'express-rate-limit'
import { RATE_LIMIT } from '@/config/constants'
import { HTTP_STATUS } from '@/config/constants'

/**
 * General rate limiter for all API endpoints
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later.',
    })
  },
})

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_REQUESTS,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      status: 'error',
      message: 'Too many authentication attempts, please try again later.',
    })
  },
})

/**
 * Moderate rate limiter for data modification endpoints
 * 30 requests per 15 minutes per IP
 */
export const modifyLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: 30,
  message: {
    status: 'error',
    message: 'Too many modification requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
})
