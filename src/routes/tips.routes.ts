import { Router } from 'express'
import { TipsController } from '../controllers/tips.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

/**
 * @route   GET /api/tips
 * @desc    Get all savings tips (with optional filters)
 * @access  Private
 * @query   priority (HIGH|MEDIUM|LOW), category (CRYPTO|RETAIL|BANKING|TRANSPORT)
 */
router.get('/', authenticate, TipsController.getAllTips)

/**
 * @route   GET /api/tips/personalized
 * @desc    Get personalized tips based on user spending
 * @access  Private
 */
router.get('/personalized', authenticate, TipsController.getPersonalized)

/**
 * @route   POST /api/tips/:tipId/feedback
 * @desc    Submit feedback for a tip (helpful/dismiss)
 * @access  Private
 * @body    { helpful: boolean, dismiss?: boolean }
 */
router.post('/:tipId/feedback', authenticate, TipsController.submitFeedback)

/**
 * @route   POST /api/tips/:tipId/view
 * @desc    Mark tip as viewed
 * @access  Private
 */
router.post('/:tipId/view', authenticate, TipsController.markAsViewed)

export default router
