import { Response, NextFunction } from 'express'
import { AuthRequest } from '@/middleware/auth'
import { bankAccountService } from '@/services/bankAccount.service'
import { HTTP_STATUS } from '@/config/constants'

export class BankAccountController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const bankAccount = await bankAccountService.create(userId, req.body)
      res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { bankAccount } })
    } catch (error) {
      next(error)
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const bankAccounts = await bankAccountService.findAll(userId)
      res.status(HTTP_STATUS.OK).json({ status: 'success', data: { bankAccounts } })
    } catch (error) {
      next(error)
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const bankAccount = await bankAccountService.findById(req.params.id, userId)
      res.status(HTTP_STATUS.OK).json({ status: 'success', data: { bankAccount } })
    } catch (error) {
      next(error)
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const bankAccount = await bankAccountService.update(req.params.id, userId, req.body)
      res.status(HTTP_STATUS.OK).json({ status: 'success', message: 'Bank account updated successfully', data: { bankAccount } })
    } catch (error) {
      next(error)
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })

      const result = await bankAccountService.delete(req.params.id, userId)
      res.status(HTTP_STATUS.OK).json({ status: 'success', message: result.message })
    } catch (error) {
      next(error)
    }
  }
}

export const bankAccountController = new BankAccountController()
