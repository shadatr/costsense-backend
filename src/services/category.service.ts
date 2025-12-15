import { prisma } from '@/config/database'
import { NotFoundError, ConflictError } from '@/utils/errors'
import logger from '@/utils/logger'

export class CategoryService {
  /**
   * Create a new category
   */
  async create(userId: string, data: { name: string; icon?: string; color?: string }) {
    // Check if category name already exists for this user
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: data.name,
      },
    })

    if (existing) {
      throw new ConflictError('Category with this name already exists')
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        userId,
        isDefault: false,
      },
    })

    logger.info(`Category created: ${category.id} for user: ${userId}`)

    return category
  }

  /**
   * Get all categories for a user
   */
  async findAll(userId: string) {
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    })

    return categories
  }

  /**
   * Get category by ID
   */
  async findById(id: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    })

    if (!category) {
      throw new NotFoundError('Category not found')
    }

    return category
  }

  /**
   * Update category
   */
  async update(id: string, userId: string, data: { name?: string; icon?: string; color?: string }) {
    // Verify ownership
    await this.findById(id, userId)

    // If updating name, check for conflicts
    if (data.name) {
      const existing = await prisma.category.findFirst({
        where: {
          userId,
          name: data.name,
          id: { not: id },
        },
      })

      if (existing) {
        throw new ConflictError('Category with this name already exists')
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    })

    logger.info(`Category updated: ${category.id}`)

    return category
  }

  /**
   * Delete category
   */
  async delete(id: string, userId: string) {
    // Verify ownership
    const category = await this.findById(id, userId)

    // Prevent deletion of default categories
    if (category.isDefault) {
      throw new ConflictError('Cannot delete default categories')
    }

    // Check if category has expenses
    const expenseCount = await prisma.expense.count({
      where: { categoryId: id },
    })

    if (expenseCount > 0) {
      throw new ConflictError(
        `Cannot delete category with ${expenseCount} expense(s). Please reassign or delete expenses first.`
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    logger.info(`Category deleted: ${id}`)

    return { message: 'Category deleted successfully' }
  }

  /**
   * Get category statistics
   */
  async getStatistics(id: string, userId: string) {
    await this.findById(id, userId)

    const expenses = await prisma.expense.findMany({
      where: { categoryId: id },
      select: {
        amount: true,
        date: true,
      },
    })

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const count = expenses.length
    const average = count > 0 ? total / count : 0

    return {
      total,
      count,
      average,
      expenses,
    }
  }
}

export const categoryService = new CategoryService()
