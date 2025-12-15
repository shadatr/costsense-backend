import { Response, NextFunction } from 'express'
import { AuthRequest } from '@/middleware/auth'
import { categoryService } from '@/services/category.service'
import { HTTP_STATUS } from '@/config/constants'

export class CategoryController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })
      }

      const category = await categoryService.create(userId, req.body)
      res.status(HTTP_STATUS.CREATED).json({ status: 'success', data: { category } })
    } catch (error) {
      next(error)
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })
      }

      const categories = await categoryService.findAll(userId)
      res.status(HTTP_STATUS.OK).json({ status: 'success', data: { categories } })
    } catch (error) {
      next(error)
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })
      }

      const category = await categoryService.findById(req.params.id, userId)
      res.status(HTTP_STATUS.OK).json({ status: 'success', data: { category } })
    } catch (error) {
      next(error)
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })
      }

      const category = await categoryService.update(req.params.id, userId, req.body)
      res.status(HTTP_STATUS.OK).json({ status: 'success', message: 'Category updated successfully', data: { category } })
    } catch (error) {
      next(error)
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ status: 'error', message: 'Unauthorized' })
      }

      const result = await categoryService.delete(req.params.id, userId)
      res.status(HTTP_STATUS.OK).json({ status: 'success', message: result.message })
    } catch (error) {
      next(error)
    }
  }
}

export const categoryController = new CategoryController()
