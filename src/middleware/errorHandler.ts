import { Request, Response, NextFunction } from 'express'
import { AppError } from '@/utils/errors'
import logger from '@/utils/logger'
import { ZodError } from 'zod'
import { HTTP_STATUS } from '@/config/constants'

/**
 * Global error handler middleware
 * Must be the last middleware in the chain
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error details
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.userId,
  })

  // Handle known AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    })
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }))

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: 'error',
      message: 'Validation failed',
      errors: formattedErrors,
    })
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: 'error',
      message: 'Invalid token',
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: 'error',
      message: 'Token expired',
    })
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return handlePrismaError(err, res)
  }

  // Default to 500 internal server error
  const statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message

  return res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(err: any, res: Response) {
  const code = err.code

  switch (code) {
    case 'P2002':
      // Unique constraint violation
      return res.status(HTTP_STATUS.CONFLICT).json({
        status: 'error',
        message: 'A record with this value already exists',
      })

    case 'P2025':
      // Record not found
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: 'error',
        message: 'Record not found',
      })

    case 'P2003':
      // Foreign key constraint violation
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid reference to related record',
      })

    case 'P2014':
      // Required relation violation
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: 'error',
        message: 'Required relationship is missing',
      })

    default:
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Database error occurred',
      })
  }
}

/**
 * Handle 404 Not Found
 * Place before the error handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    status: 'error',
    message: `Route ${req.method} ${req.url} not found`,
  })
}
