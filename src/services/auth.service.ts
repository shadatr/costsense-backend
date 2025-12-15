import { prisma } from '@/config/database'
import { hashPassword, comparePassword } from '@/utils/bcrypt'
import { generateTokenPair } from '@/utils/jwt'
import { ConflictError, UnauthorizedError, NotFoundError } from '@/utils/errors'
import { DEFAULT_CATEGORIES } from '@/config/constants'
import logger from '@/utils/logger'

export class AuthService {
  /**
   * Register a new user
   */
  async register(name: string, email: string, password: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ConflictError('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user in a transaction with default data
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      })

      // Create default user preferences
      await tx.userPreferences.create({
        data: {
          userId: user.id,
          currency: 'TRY',
          language: 'tr',
          theme: 'light',
        },
      })

      // Create default categories
      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          ...cat,
          userId: user.id,
          isDefault: true,
        })),
      })

      return user
    })

    logger.info(`New user registered: ${result.email}`)

    // Generate tokens
    const tokens = generateTokenPair(result.id, result.email)

    return {
      user: result,
      ...tokens,
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    })

    if (!user) {
      throw new UnauthorizedError('Invalid email or password')
    }

    // Check if user has a password (they might be OAuth only)
    if (!user.password) {
      throw new UnauthorizedError('Please login with your social account')
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password)

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password')
    }

    logger.info(`User logged in: ${user.email}`)

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email)

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      ...tokens,
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const { verifyRefreshToken } = await import('@/utils/jwt')
      const decoded = verifyRefreshToken(refreshToken)

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
        },
      })

      if (!user) {
        throw new UnauthorizedError('User not found')
      }

      // Generate new token pair
      const tokens = generateTokenPair(user.id, user.email)

      logger.debug(`Token refreshed for user: ${user.email}`)

      return tokens
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token')
    }
  }

  /**
   * Logout user (token invalidation would happen on client side)
   * This is a placeholder for future token blacklisting implementation
   */
  async logout(userId: string) {
    logger.info(`User logged out: ${userId}`)

    // In a JWT system, logout is typically handled client-side by removing tokens
    // For additional security, you could implement a token blacklist here
    // using Redis or a database table

    return {
      message: 'Logged out successfully',
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserById(userId: string) {
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
}

export const authService = new AuthService()
