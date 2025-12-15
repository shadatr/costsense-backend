import { prisma } from '@/config/database'
import { NotFoundError, ConflictError } from '@/utils/errors'
import { hashPassword } from '@/utils/bcrypt'
import logger from '@/utils/logger'

export class UserService {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    return user
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, data: { name?: string; email?: string }) {
    // If email is being changed, check if it's already taken
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError('Email already in use')
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        updatedAt: true,
      },
    })

    logger.info(`User profile updated: ${user.email}`)

    return user
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string) {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    })

    if (!preferences) {
      // Create default preferences if they don't exist
      return await prisma.userPreferences.create({
        data: {
          userId,
          currency: 'TRY',
          language: 'tr',
          theme: 'light',
        },
      })
    }

    return preferences
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    data: {
      currency?: string
      language?: string
      notificationsEnabled?: boolean
      emailNotifications?: boolean
      pushNotifications?: boolean
      budgetAlerts?: boolean
      theme?: string
    }
  ) {
    // Check if preferences exist
    const existing = await prisma.userPreferences.findUnique({
      where: { userId },
    })

    if (!existing) {
      // Create with provided data
      return await prisma.userPreferences.create({
        data: {
          userId,
          ...data,
        },
      })
    }

    // Update existing preferences
    const preferences = await prisma.userPreferences.update({
      where: { userId },
      data,
    })

    logger.info(`User preferences updated: ${userId}`)

    return preferences
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    })

    logger.warn(`User account deleted: ${user.email}`)

    return {
      message: 'User account deleted successfully',
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    if (!user.password) {
      throw new ConflictError('Cannot change password for OAuth users')
    }

    // Verify current password
    const { comparePassword } = await import('@/utils/bcrypt')
    const isValid = await comparePassword(currentPassword, user.password)

    if (!isValid) {
      throw new ConflictError('Current password is incorrect')
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    logger.info(`Password changed for user: ${userId}`)

    return {
      message: 'Password changed successfully',
    }
  }
}

export const userService = new UserService()
