import { Response, NextFunction } from 'express'
import { AuthRequest } from '@/middleware/auth'
import { analyticsService } from '@/services/analytics.service'
import { HTTP_STATUS } from '@/config/constants'

export class AnalyticsController {
  async getDashboardSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      console.log('📊 [Analytics] Dashboard request for userId:', userId)

      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const summary = await analyticsService.getDashboardSummary(userId)
      console.log('📊 [Analytics] Dashboard summary:', JSON.stringify(summary, null, 2))

      res.status(HTTP_STATUS.OK).json({ status: 'success', data: summary })
    } catch (error) {
      console.error('❌ [Analytics] Dashboard error:', error)
      next(error)
    }
  }

  async getSpendingByCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const { startDate, endDate } = req.query
      const breakdown = await analyticsService.getSpendingByCategory(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      )

      res.status(HTTP_STATUS.OK).json({ status: 'success', data: { breakdown } })
    } catch (error) {
      next(error)
    }
  }

  async getMonthlyTrends(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const months = req.query.months ? parseInt(req.query.months as string) : 6
      const trends = await analyticsService.getMonthlyTrends(userId, months)

      res.status(HTTP_STATUS.OK).json({ status: 'success', data: { trends } })
    } catch (error) {
      next(error)
    }
  }

  async getBudgetAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const alerts = await analyticsService.getBudgetAlerts(userId)
      res.status(HTTP_STATUS.OK).json({ status: 'success', data: { alerts } })
    } catch (error) {
      next(error)
    }
  }
}

export const analyticsController = new AnalyticsController()
