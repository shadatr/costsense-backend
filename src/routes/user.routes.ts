import { Router } from 'express'
import { userController } from '@/controllers/user.controller'
import { validate } from '@/middleware/validation'
import { updateUserProfileSchema, updateUserPreferencesSchema } from '@/utils/validators'
import { authenticate } from '@/middleware/auth'

const router = Router()

// All user routes require authentication
router.use(authenticate)

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', userController.getProfile.bind(userController))

/**
 * @route   PATCH /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch(
  '/profile',
  validate(updateUserProfileSchema),
  userController.updateProfile.bind(userController)
)

/**
 * @route   GET /api/v1/users/preferences
 * @desc    Get user preferences
 * @access  Private
 */
router.get('/preferences', userController.getPreferences.bind(userController))

/**
 * @route   PATCH /api/v1/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.patch(
  '/preferences',
  validate(updateUserPreferencesSchema),
  userController.updatePreferences.bind(userController)
)

/**
 * @route   POST /api/v1/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', userController.changePassword.bind(userController))

/**
 * @route   DELETE /api/v1/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', userController.deleteAccount.bind(userController))

export default router
