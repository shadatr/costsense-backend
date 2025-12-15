import { Response, NextFunction } from 'express'
import { AuthRequest } from '@/middleware/auth'
import { userService } from '@/services/user.service'
import { HTTP_STATUS } from '@/config/constants'

export class UserController {
  /**
   * Get user profile
   * GET /api/v1/users/profile
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Unauthorized',
        })
      }

      const user = await userService.getUserProfile(userId)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: { user },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update user profile
   * PATCH /api/v1/users/profile
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Unauthorized',
        })
      }

      const { name, email } = req.body

      const user = await userService.updateUserProfile(userId, { name, email })

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: { user },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get user preferences
   * GET /api/v1/users/preferences
   */
  async getPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Unauthorized',
        })
      }

      const preferences = await userService.getUserPreferences(userId)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: { preferences },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update user preferences
   * PATCH /api/v1/users/preferences
   */
  async updatePreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Unauthorized',
        })
      }

      const preferences = await userService.updateUserPreferences(userId, req.body)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Preferences updated successfully',
        data: { preferences },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Change password
   * POST /api/v1/users/change-password
   */
  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Unauthorized',
        })
      }

      const { currentPassword, newPassword } = req.body

      const result = await userService.changePassword(userId, currentPassword, newPassword)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: result.message,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete user account
   * DELETE /api/v1/users/account
   */
  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Unauthorized',
        })
      }

      const result = await userService.deleteUser(userId)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: result.message,
      })
    } catch (error) {
      next(error)
    }
  }
}

export const userController = new UserController()
