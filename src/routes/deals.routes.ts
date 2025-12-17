import { Router } from 'express'
import { DealsController } from '../controllers/deals.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

/**
 * @route   GET /api/deals/nearby
 * @desc    Get deals near user's location
 * @access  Private
 * @query   lat, lng, radius (optional, default 5km)
 */
router.get('/nearby', authenticate, DealsController.getNearbyDeals)

/**
 * @route   GET /api/deals/category/:categoryName
 * @desc    Get deals by category
 * @access  Private
 */
router.get('/category/:categoryName', authenticate, DealsController.getByCategory)

/**
 * @route   GET /api/deals/saved
 * @desc    Get user's saved deals
 * @access  Private
 */
router.get('/saved', authenticate, DealsController.getSavedDeals)

/**
 * @route   POST /api/deals/track
 * @desc    Save/track a deal
 * @access  Private
 * @body    { dealId: string }
 */
router.post('/track', authenticate, DealsController.trackDeal)

export default router
