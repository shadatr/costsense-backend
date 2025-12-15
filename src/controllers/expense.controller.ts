import { Response, NextFunction } from 'express'
import { AuthRequest } from '@/middleware/auth'
import { expenseService } from '@/services/expense.service'
import { HTTP_STATUS } from '@/config/constants'

export class ExpenseController {
  /**
   * Create expense
   * POST /api/v1/expenses
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Unauthorized',
        })
      }

      const expense = await expenseService.create(userId, req.body)

      res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        data: { expense },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all expenses
   * GET /api/v1/expenses
   */
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Unauthorized',
        })
      }

      const result = await expenseService.findAll(userId, req.query)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get expense by ID
   * GET /api/v1/expenses/:id
   */
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Unauthorized',
        })
      }

      const expense = await expenseService.findById(req.params.id, userId)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: { expense },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update expense
   * PATCH /api/v1/expenses/:id
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Unauthorized',
        })
      }

      const expense = await expenseService.update(req.params.id, userId, req.body)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Expense updated successfully',
        data: { expense },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete expense
   * DELETE /api/v1/expenses/:id
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Unauthorized',
        })
      }

      const result = await expenseService.delete(req.params.id, userId)

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: result.message,
      })
    } catch (error) {
      next(error)
    }
  }
}

export const expenseController = new ExpenseController()
