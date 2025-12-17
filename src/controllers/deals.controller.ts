import { Request, Response } from 'express'
import dealsService from '../services/deals.service'
import logger from '../utils/logger'

export class DealsController {
  /**
   * Get nearby deals
   * GET /api/v1/deals/nearby?lat=41.0082&lng=28.9784&radius=5
   * Requires authentication
   */
  static async getNearbyDeals(req: Request, res: Response) {
    try {
      const lat = parseFloat(req.query.lat as string)
      const lng = parseFloat(req.query.lng as string)
      const radius = parseFloat(req.query.radius as string) || 5 // km

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          message: 'Valid latitude and longitude are required',
        })
      }

      if (isNaN(radius) || radius < 0 || radius > 50) {
        return res.status(400).json({
          success: false,
          message: 'Radius must be between 0 and 50 km',
        })
      }

      const nearbyDeals = await dealsService.findNearbyDeals({ lat, lng }, radius)

      return res.status(200).json({
        success: true,
        data: nearbyDeals,
        meta: {
          total: nearbyDeals.length,
          radius,
          userLocation: { lat, lng },
        },
      })
    } catch (error) {
      logger.error('Error fetching nearby deals:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch nearby deals',
      })
    }
  }

  /**
   * Get deals by category
   * GET /api/v1/deals/category/:categoryName
   * Requires authentication
   */
  static async getByCategory(req: Request, res: Response) {
    try {
      const { categoryName } = req.params

      if (!categoryName) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required',
        })
      }

      const deals = await dealsService.getDealsByCategory(categoryName)

      return res.status(200).json({
        success: true,
        data: deals,
        meta: {
          total: deals.length,
          category: categoryName,
        },
      })
    } catch (error) {
      logger.error('Error fetching deals by category:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch deals',
      })
    }
  }

  /**
   * Track/save a deal
   * POST /api/v1/deals/track
   * Requires authentication
   * Body: { dealId: string }
   */
  static async trackDeal(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id
      const { dealId } = req.body

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        })
      }

      if (!dealId) {
        return res.status(400).json({
          success: false,
          message: 'Deal ID is required',
        })
      }

      await dealsService.trackDeal(userId, dealId)

      return res.status(201).json({
        success: true,
        message: 'Deal saved successfully',
      })
    } catch (error) {
      logger.error('Error tracking deal:', error)

      if (error instanceof Error && error.message.includes('not found or expired')) {
        return res.status(404).json({
          success: false,
          message: 'Deal not found or expired',
        })
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to track deal',
      })
    }
  }

  /**
   * Get user's saved deals
   * GET /api/v1/deals/saved
   * Requires authentication
   */
  static async getSavedDeals(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        })
      }

      const savedDeals = await dealsService.getUserSavedDeals(userId)

      return res.status(200).json({
        success: true,
        data: savedDeals,
        meta: {
          total: savedDeals.length,
        },
      })
    } catch (error) {
      logger.error('Error fetching saved deals:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch saved deals',
      })
    }
  }

  /**
   * Mark deal as used
   * POST /api/v1/deals/:dealId/use
   * Requires authentication
   */
  static async markDealAsUsed(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id
      const { dealId } = req.params

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        })
      }

      if (!dealId) {
        return res.status(400).json({
          success: false,
          message: 'Deal ID is required',
        })
      }

      await dealsService.markDealAsUsed(userId, dealId)

      return res.status(200).json({
        success: true,
        message: 'Deal marked as used',
      })
    } catch (error) {
      logger.error('Error marking deal as used:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to mark deal as used',
      })
    }
  }
}

export default DealsController
