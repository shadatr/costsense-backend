import { Router } from 'express'
import { expenseController } from '@/controllers/expense.controller'
import { validate } from '@/middleware/validation'
import { createExpenseSchema, updateExpenseSchema } from '@/utils/validators'
import { authenticate } from '@/middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

/**
 * @route   POST /api/v1/expenses
 * @desc    Create expense
 * @access  Private
 */
router.post('/', validate(createExpenseSchema), expenseController.create.bind(expenseController))

/**
 * @route   GET /api/v1/expenses
 * @desc    Get all expenses
 * @access  Private
 */
router.get('/', expenseController.findAll.bind(expenseController))

/**
 * @route   GET /api/v1/expenses/monthly-summary
 * @desc    Get monthly expense summary
 * @access  Private
 */
router.get('/monthly-summary', expenseController.getMonthlySummary.bind(expenseController))

/**
 * @route   GET /api/v1/expenses/:id
 * @desc    Get expense by ID
 * @access  Private
 */
router.get('/:id', expenseController.findById.bind(expenseController))

/**
 * @route   PATCH /api/v1/expenses/:id
 * @desc    Update expense
 * @access  Private
 */
router.patch('/:id', validate(updateExpenseSchema), expenseController.update.bind(expenseController))

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Delete expense
 * @access  Private
 */
router.delete('/:id', expenseController.delete.bind(expenseController))

export default router
