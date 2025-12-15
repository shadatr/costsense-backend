import jwt from 'jsonwebtoken'
import { env } from '@/config/env'

export interface JwtPayload {
  userId: string
  email: string
  type: 'access' | 'refresh'
}

export const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email, type: 'access' } as JwtPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  )
}

export const generateRefreshToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email, type: 'refresh' } as JwtPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  )
}

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type')
    }

    return decoded
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type')
    }

    return decoded
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}

export const generateTokenPair = (userId: string, email: string) => {
  return {
    accessToken: generateAccessToken(userId, email),
    refreshToken: generateRefreshToken(userId, email),
  }
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload
  } catch (error) {
    return null
  }
}
