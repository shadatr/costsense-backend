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

  /**
   * Get monthly summary for expenses
   */
  async getMonthlySummary(userId: string, month: string) {
    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number)

    // Get first and last day of month
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0, 23, 59, 59)
    const today = new Date()
    const daysInMonth = endDate.getDate()
    const currentDay = today.getMonth() === monthNum - 1 && today.getFullYear() === year
      ? today.getDate()
      : daysInMonth
    const daysRemaining = Math.max(0, daysInMonth - currentDay)

    // Get expenses for this month
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    })

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const transactionCount = expenses.length
    const averagePerDay = currentDay > 0 ? totalSpent / currentDay : 0

    // Find top category
    const categorySpending = new Map<string, { name: string; amount: number }>()
    expenses.forEach((expense) => {
      const categoryName = expense.category?.name || 'Uncategorized'
      const current = categorySpending.get(categoryName) || { name: categoryName, amount: 0 }
      categorySpending.set(categoryName, {
        name: categoryName,
        amount: current.amount + expense.amount,
      })
    })

    const topCategoryEntry = Array.from(categorySpending.values()).sort(
      (a, b) => b.amount - a.amount
    )[0]
    const topCategory = topCategoryEntry?.name || 'None'

    // Get last month's data for comparison
    const lastMonthStart = new Date(year, monthNum - 2, 1)
    const lastMonthEnd = new Date(year, monthNum - 1, 0, 23, 59, 59)
    const lastMonthResult = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    })

    const lastMonthTotal = lastMonthResult._sum.amount || 0
    const amountChange = totalSpent - lastMonthTotal
    const percentageChange = lastMonthTotal > 0 ? (amountChange / lastMonthTotal) * 100 : 0

    return {
      month,
      totalSpent: Math.round(totalSpent * 100) / 100,
      transactionCount,
      averagePerDay: Math.round(averagePerDay * 100) / 100,
      daysInMonth,
      daysRemaining,
      topCategory,
      comparisonLastMonth: {
        percentageChange: Math.round(percentageChange * 10) / 10,
        amountChange: Math.round(amountChange * 100) / 100,
      },
    }
  }
}

export const expenseService = new ExpenseService()
