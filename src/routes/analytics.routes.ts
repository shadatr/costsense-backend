import { Router } from 'express'
import { analyticsController } from '@/controllers/analytics.controller'
import { authenticate } from '@/middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/summary', analyticsController.getDashboardSummary.bind(analyticsController))
router.get('/spending-by-category', analyticsController.getSpendingByCategory.bind(analyticsController))
router.get('/monthly-trends', analyticsController.getMonthlyTrends.bind(analyticsController))
router.get('/budget-alerts', analyticsController.getBudgetAlerts.bind(analyticsController))

export default router
