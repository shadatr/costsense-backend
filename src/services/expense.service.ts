import { prisma } from '@/config/database'
import { NotFoundError } from '@/utils/errors'
import logger from '@/utils/logger'

export class ExpenseService {
  /**
   * Create a new expense
   */
  async create(userId: string, data: any) {
    const expense = await prisma.expense.create({
      data: {
        ...data,
        userId,
        date: data.date ? new Date(data.date) : new Date(),
      },
      include: {
        category: true,
        bankAccount: true,
      },
    })

    logger.info(`Expense created: ${expense.id} for user: ${userId}`)

    return expense
  }

  /**
   * Get all expenses for a user with filters
   */
  async findAll(userId: string, filters: any) {
    const { categoryId, startDate, endDate, limit = 50, offset = 0 } = filters

    const where: any = { userId }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
          bankAccount: {
            select: {
              id: true,
              bankName: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.expense.count({ where }),
    ])

    return {
      expenses,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    }
  }

  /**
   * Get expense by ID
   */
  async findById(id: string, userId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, userId },
      include: {
        category: true,
        bankAccount: true,
      },
    })

    if (!expense) {
      throw new NotFoundError('Expense not found')
    }

    return expense
  }

  /**
   * Update expense
   */
  async update(id: string, userId: string, data: any) {
    // Verify ownership
    await this.findById(id, userId)

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        category: true,
        bankAccount: true,
      },
    })

    logger.info(`Expense updated: ${expense.id}`)

    return expense
  }

  /**
   * Delete expense
   */
  async delete(id: string, userId: string) {
    // Verify ownership
    await this.findById(id, userId)

    await prisma.expense.delete({
      where: { id },
    })

    logger.info(`Expense deleted: ${id}`)

    return { message: 'Expense deleted successfully' }
  }

  /**
   * Get total expenses for a user
   */
  async getTotalExpenses(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    const result = await prisma.expense.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    })

    return {
      total: result._sum.amount || 0,
      count: result._count,
    }
  }
}

export const expenseService = new ExpenseService()
