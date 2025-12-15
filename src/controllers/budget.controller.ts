import { Response, NextFunction } from 'express'
import { AuthRequest } from '@/middleware/auth'
import { budgetService } from '@/services/budget.service'
import { HTTP_STATUS } from '@/config/constants'

export class BudgetController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const budget = await budgetService.create(userId, req.body)
      res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { budget } })
    } catch (error) {
      next(error)
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const budgets = await budgetService.findAll(userId)
      res.status(HTTP_STATUS.OK).json({ status: 'success', data: { budgets } })
    } catch (error) {
      next(error)
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const budget = await budgetService.findById(req.params.id, userId)
      res.status(HTTP_STATUS.OK).json({ status: 'success', data: { budget } })
    } catch (error) {
      next(error)
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const budget = await budgetService.update(req.params.id, userId, req.body)
      res.status(HTTP_STATUS.OK).json({ status: 'success', message: 'Budget updated successfully', data: { budget } })
    } catch (error) {
      next(error)
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const result = await budgetService.delete(req.params.id, userId)
      res.status(HTTP_STATUS.OK).json({ status: 'success', message: result.message })
    } catch (error) {
      next(error)
    }
  }

  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const status = await budgetService.getBudgetStatus(req.params.id, userId)
      res.status(HTTP_STATUS.OK).json({ status: 'success', data: status })
    } catch (error) {
      next(error)
    }
  }
}

export const budgetController = new BudgetController()
