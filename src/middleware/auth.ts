import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, JwtPayload } from '@/utils/jwt'
import { UnauthorizedError } from '@/utils/errors'
import logger from '@/utils/logger'

export interface AuthRequest extends Request {
  user?: JwtPayload
}

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided')
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const decoded = verifyAccessToken(token)

    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Invalid token type')
    }

    req.user = decoded
    next()
  } catch (error) {
    logger.error('Authentication error:', error)

    if (error instanceof Error) {
      next(new UnauthorizedError(error.message))
    } else {
      next(new UnauthorizedError('Authentication failed'))
    }
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't throw error if missing
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = verifyAccessToken(token)

      if (decoded.type === 'access') {
        req.user = decoded
      }
    }

    next()
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed:', error)
    next()
  }
}
