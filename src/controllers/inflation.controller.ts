import { Request, Response } from 'express'
import inflationService from '../services/inflation.service'
import logger from '../utils/logger'

export class InflationController {
  /**
   * Get current inflation rate
   * GET /api/v1/inflation/current
   * Public endpoint (cached for 24 hours on client)
   */
  static async getCurrentRate(req: Request, res: Response) {
    try {
      const inflationData = await inflationService.fetchTurkeyInflationData()

      if (!inflationData) {
        return res.status(404).json({
          success: false,
          message: 'No inflation data available',
        })
      }

      return res.status(200).json({
        success: true,
        data: inflationData,
      })
    } catch (error) {
      logger.error('Error fetching current inflation rate:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch inflation rate',
      })
    }
  }

  /**
   * Get historical inflation data
   * GET /api/v1/inflation/history?months=6
   * Requires authentication
   */
  static async getHistory(req: Request, res: Response) {
    try {
      const months = parseInt(req.query.months as string) || 6

      // Validate months parameter
      if (months < 1 || months > 24) {
        return res.status(400).json({
          success: false,
          message: 'Months parameter must be between 1 and 24',
        })
      }

      const historicalData = await inflationService.getHistoricalData(months)

      return res.status(200).json({
        success: true,
        data: historicalData,
        meta: {
          months,
          count: historicalData.length,
        },
      })
    } catch (error) {
      logger.error('Error fetching historical inflation data:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch historical data',
      })
    }
  }

  /**
   * Get inflation forecast for next N months
   * GET /api/v1/inflation/forecast?months=3
   * Requires authentication
   */
  static async getForecast(req: Request, res: Response) {
    try {
      const months = parseInt(req.query.months as string) || 3

      // Validate months parameter
      if (months < 1 || months > 12) {
        return res.status(400).json({
          success: false,
          message: 'Months parameter must be between 1 and 12',
        })
      }

      const predictions = await inflationService.predictNextMonths(months)

      return res.status(200).json({
        success: true,
        data: {
          predictions,
          months,
        },
      })
    } catch (error) {
      logger.error('Error generating inflation forecast:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to generate forecast. May need more historical data.',
      })
    }
  }

  /**
   * Calculate inflation impact on user's budget
   * POST /api/v1/inflation/impact
   * Body: { budgetId?: string }
   * Requires authentication
   */
  static async calculateImpact(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        })
      }

      const { budgetId } = req.body

      const impactAnalysis = await inflationService.calculateBudgetImpact(userId, budgetId)

      return res.status(200).json({
        success: true,
        data: impactAnalysis,
      })
    } catch (error) {
      logger.error('Error calculating inflation impact:', error)

      // Check for specific error messages
      if (error instanceof Error) {
        if (error.message.includes('No active budget found')) {
          return res.status(404).json({
            success: false,
            message: 'No active budget found for this user',
          })
        }

        if (error.message.includes('No inflation data available')) {
          return res.status(404).json({
            success: false,
            message: 'No inflation data available',
          })
        }
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to calculate budget impact',
      })
    }
  }

  /**
   * Get category-specific inflation rate
   * GET /api/v1/inflation/category/:categoryName
   * Requires authentication
   */
  static async getCategoryInflation(req: Request, res: Response) {
    try {
      const { categoryName } = req.params

      if (!categoryName) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required',
        })
      }

      const categoryRate = await inflationService.calculateCategoryInflation(categoryName)

      return res.status(200).json({
        success: true,
        data: {
          category: categoryName,
          inflationRate: categoryRate,
        },
      })
    } catch (error) {
      logger.error('Error fetching category inflation:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch category inflation rate',
      })
    }
  }
}

export default InflationController
