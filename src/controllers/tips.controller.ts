import { Request, Response } from 'express'
import { Priority } from '@prisma/client'
import tipsService from '../services/tips.service'
import logger from '../utils/logger'

export class TipsController {
  /**
   * Get all savings tips
   * GET /api/v1/tips?priority=HIGH&category=CRYPTO
   * Requires authentication
   */
  static async getAllTips(req: Request, res: Response) {
    try {
      const { priority, category } = req.query

      // Validate priority if provided
      if (priority && !['HIGH', 'MEDIUM', 'LOW'].includes(priority as string)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid priority value. Must be HIGH, MEDIUM, or LOW',
        })
      }

      const tips = await tipsService.getAllTips()

      // Filter by priority and category if provided
      let filteredTips = tips
      if (priority) {
        filteredTips = filteredTips.filter((tip) => tip.priority === priority)
      }
      if (category) {
        filteredTips = filteredTips.filter((tip) =>
          tip.category.toLowerCase().includes((category as string).toLowerCase())
        )
      }

      return res.status(200).json({
        success: true,
        data: filteredTips,
        meta: {
          total: filteredTips.length,
          filters: {
            priority: priority || 'all',
            category: category || 'all',
          },
        },
      })
    } catch (error) {
      logger.error('Error fetching tips:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch tips',
      })
    }
  }

  /**
   * Get personalized tips based on user spending
   * GET /api/tips/personalized
   * Requires authentication
   */
  static async getPersonalized(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const personalizedTips = await tipsService.generatePersonalizedTips(userId)

      return res.status(200).json({
        success: true,
        data: personalizedTips,
        meta: {
          total: personalizedTips.length,
          personalized: true,
        },
      })
    } catch (error) {
      logger.error('Error fetching personalized tips:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch personalized tips',
      })
    }
  }

  /**
   * Submit feedback for a tip
   * POST /api/tips/:tipId/feedback
   * Requires authentication
   * Body: { helpful: boolean, dismiss?: boolean }
   */
  static async submitFeedback(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId
      const { tipId } = req.params
      const { helpful, dismiss } = req.body

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      // Handle dismissal
      if (dismiss === true) {
        await tipsService.dismissTip(userId, tipId)
      }

      // Handle helpful feedback
      if (helpful !== undefined) {
        await tipsService.submitTipFeedback(userId, tipId, helpful)
      }

      return res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully',
      })
    } catch (error) {
      logger.error('Error submitting tip feedback:', error)

      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Tip not found',
        })
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
      })
    }
  }

  /**
   * Mark tip as viewed
   * POST /api/tips/:tipId/view
   * Requires authentication
   */
  static async markAsViewed(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId
      const { tipId } = req.params

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      await tipsService.markTipAsViewed(userId, tipId)

      return res.status(200).json({
        success: true,
        message: 'Tip marked as viewed',
      })
    } catch (error) {
      logger.error('Error marking tip as viewed:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to mark tip as viewed',
      })
    }
  }
}

export default TipsController
