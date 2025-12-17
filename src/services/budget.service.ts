import { prisma } from '@/config/database'
import { NotFoundError } from '@/utils/errors'
import logger from '@/utils/logger'

export class BudgetService {
  async create(userId: string, data: any) {
    const budget = await prisma.budget.create({
      data: {
        ...data,
        userId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        categoryBudgets: data.categoryBudgets
          ? {
              create: data.categoryBudgets.map((cb: any) => ({
                categoryId: cb.categoryId,
                amount: cb.amount,
              })),
            }
          : undefined,
      },
      include: {
        categoryBudgets: {
          include: {
            category: true,
          },
        },
      },
    })

    logger.info(`Budget created: ${budget.id} for user: ${userId}`)
    return budget
  }

  async findAll(userId: string) {
    return await prisma.budget.findMany({
      where: { userId },
      include: {
        categoryBudgets: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string, userId: string) {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
      include: {
        categoryBudgets: {
          include: {
            category: true,
          },
        },
      },
    })

    if (!budget) {
      throw new NotFoundError('Budget not found')
    }

    return budget
  }

  async update(id: string, userId: string, data: any) {
    await this.findById(id, userId)

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        categoryBudgets: {
          include: {
            category: true,
          },
        },
      },
    })

    logger.info(`Budget updated: ${budget.id}`)
    return budget
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId)

    await prisma.budget.delete({
      where: { id },
    })

    logger.info(`Budget deleted: ${id}`)
    return { message: 'Budget deleted successfully' }
  }

  async getBudgetStatus(id: string, userId: string) {
    const budget = await this.findById(id, userId)

    const expenses = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    const spent = expenses._sum.amount || 0
    const remaining = budget.totalAmount - spent
    const percentage = (spent / budget.totalAmount) * 100

    return {
      budget,
      spent,
      remaining,
      percentage: Math.round(percentage),
      isOverBudget: spent > budget.totalAmount,
    }
  }

  async getBudgetSummary(userId: string) {
    // Get the active budget
    const activeBudget = await prisma.budget.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        categoryBudgets: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!activeBudget) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        percentage: 0,
        categories: [],
      }
    }

    // Get expenses for the current budget period
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: activeBudget.startDate,
          lte: activeBudget.endDate,
        },
      },
      include: {
        category: true,
      },
    })

    // Calculate total spent
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const totalPercentage = (totalSpent / activeBudget.totalAmount) * 100

    // Calculate spending by category
    const categorySpending = new Map<string, number>()
    expenses.forEach((expense) => {
      const categoryId = expense.categoryId
      const current = categorySpending.get(categoryId) || 0
      categorySpending.set(categoryId, current + expense.amount)
    })

    // Build category summary
    const categories = activeBudget.categoryBudgets.map((cb) => {
      const spent = categorySpending.get(cb.categoryId) || 0
      const percentage = cb.amount > 0 ? (spent / cb.amount) * 100 : 0

      return {
        id: cb.categoryId,
        name: cb.category.name,
        icon: cb.category.icon || '💰',
        budget: cb.amount,
        spent,
        percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
      }
    })

    return {
      totalBudget: activeBudget.totalAmount,
      totalSpent,
      percentage: Math.round(totalPercentage * 10) / 10,
      categories,
    }
  }
}

export const budgetService = new BudgetService()
