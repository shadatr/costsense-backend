import { Request, Response, NextFunction } from 'express'
import { authService } from '@/services/auth.service'
import { AuthRequest } from '@/middleware/auth'
import { HTTP_STATUS } from '@/config/constants'
import logger from '@/utils/logger'

export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body

      const result = await authService.register(name, email, password)

      res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        message: 'User registered successfully',
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body

      const result = await authService.login(email, password)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Login successful',
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body

      const result = await authService.refreshToken(refreshToken)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.OK).json({
          status: 'success',
          message: 'Logged out successfully',
        })
      }

      const result = await authService.logout(userId)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: result.message,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Unauthorized',
        })
      }

      const user = await authService.getUserById(userId)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: { user },
      })
    } catch (error) {
      next(error)
    }
  }
}

export const authController = new AuthController()
