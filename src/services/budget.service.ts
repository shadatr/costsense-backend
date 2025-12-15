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
}

export const budgetService = new BudgetService()
