import { Request, Response, NextFunction } from 'express'
import { AnyZodObject, ZodError } from 'zod'
import { ValidationError } from '@/utils/errors'
import logger from '@/utils/logger'

/**
 * Validation middleware factory
 * Validates request body, query params, and route params using Zod schema
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }))

        logger.warn('Validation error:', { errors: formattedErrors, url: req.url })

        next(
          new ValidationError(
            `Validation failed: ${formattedErrors.map((e) => e.message).join(', ')}`
          )
        )
      } else {
        next(error)
      }
    }
  }
}

/**
 * Sanitize request body to prevent injection attacks
 * Removes any properties that start with $ or contain .
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  next()
}

function sanitizeObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  const sanitized: any = {}
  for (const key in obj) {
    // Skip keys that could be malicious (MongoDB injection prevention)
    if (key.startsWith('$') || key.includes('.')) {
      logger.warn(`Blocked potentially malicious key: ${key}`)
      continue
    }

    sanitized[key] = sanitizeObject(obj[key])
  }

  return sanitized
}
