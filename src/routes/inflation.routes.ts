import { Router } from 'express'
import { InflationController } from '../controllers/inflation.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

/**
 * @route   GET /api/inflation/current
 * @desc    Get current Turkey inflation rate
 * @access  Public (cached)
 */
router.get('/current', InflationController.getCurrentRate)

/**
 * @route   GET /api/inflation/history
 * @desc    Get historical inflation data
 * @access  Private
 * @query   months - Number of months to retrieve (default: 12)
 */
router.get('/history', authenticate, InflationController.getHistory)

/**
 * @route   GET /api/inflation/forecast
 * @desc    Get inflation forecast for next 3 months
 * @access  Private
 */
router.get('/forecast', authenticate, InflationController.getForecast)

/**
 * @route   POST /api/inflation/impact
 * @desc    Calculate inflation impact on user's budget
 * @access  Private
 * @body    { budgetId: string }
 */
router.post('/impact', authenticate, InflationController.calculateImpact)

export default router
