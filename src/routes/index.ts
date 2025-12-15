import { Router } from 'express'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import expenseRoutes from './expense.routes'
import categoryRoutes from './category.routes'
import budgetRoutes from './budget.routes'
import bankAccountRoutes from './bankAccount.routes'
import analyticsRoutes from './analytics.routes'

const router = Router()

/**
 * Mount routes
 */
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/expenses', expenseRoutes)
router.use('/categories', categoryRoutes)
router.use('/budgets', budgetRoutes)
router.use('/bank-accounts', bankAccountRoutes)
router.use('/analytics', analyticsRoutes)

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  })
})

export default router
