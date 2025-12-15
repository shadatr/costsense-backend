import { prisma } from '@/config/database'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export class AnalyticsService {
  /**
   * Get dashboard summary
   */
  async getDashboardSummary(userId: string) {
    const now = new Date()
    const startOfCurrentMonth = startOfMonth(now)
    const endOfCurrentMonth = endOfMonth(now)

    // Get current month expenses
    const currentMonthExpenses = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth,
        },
      },
      _sum: { amount: true },
      _count: true,
    })

    // Get active budgets
    const activeBudgets = await prisma.budget.findMany({
      where: {
        userId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    })

    const totalBudget = activeBudgets.reduce((sum, b) => sum + b.totalAmount, 0)
    const totalSpent = currentMonthExpenses._sum.amount || 0
    const budgetUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    // Get recent expenses
    const recentExpenses = await prisma.expense.findMany({
      where: { userId },
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        category: {
          select: {
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    })

    // Get category breakdown
    const categoryBreakdown = await this.getSpendingByCategory(userId, startOfCurrentMonth, endOfCurrentMonth)

    return {
      totalExpenses: totalSpent,
      expenseCount: currentMonthExpenses._count,
      totalBudget,
      budgetUsage: Math.round(budgetUsage),
      recentExpenses,
      categoryBreakdown,
    }
  }

  /**
   * Get spending by category
   */
  async getSpendingByCategory(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    const expenses = await prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: {
        amount: true,
      },
    })

    const categories = await prisma.category.findMany({
      where: {
        userId,
        id: {
          in: expenses.map((e) => e.categoryId),
        },
      },
    })

    return expenses.map((exp) => {
      const category = categories.find((c) => c.id === exp.categoryId)
      return {
        category: category?.name || 'Unknown',
        categoryId: exp.categoryId,
        amount: exp._sum.amount || 0,
        color: category?.color || '#6b7280',
        icon: category?.icon || '📌',
      }
    }).sort((a, b) => b.amount - a.amount)
  }

  /**
   * Get monthly trends
   */
  async getMonthlyTrends(userId: string, months: number = 6) {
    const trends = []
    const now = new Date()

    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(now, i)
      const start = startOfMonth(monthDate)
      const end = endOfMonth(monthDate)

      const expenses = await prisma.expense.aggregate({
        where: {
          userId,
          date: {
            gte: start,
            lte: end,
          },
        },
        _sum: { amount: true },
        _count: true,
      })

      trends.push({
        month: format(monthDate, 'MMM yyyy'),
        total: expenses._sum.amount || 0,
        count: expenses._count,
      })
    }

    return trends.reverse()
  }

  /**
   * Get budget alerts
   */
  async getBudgetAlerts(userId: string) {
    const now = new Date()

    const activeBudgets = await prisma.budget.findMany({
      where: {
        userId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        categoryBudgets: {
          include: {
            category: true,
          },
        },
      },
    })

    const alerts = []

    for (const budget of activeBudgets) {
      const expenses = await prisma.expense.aggregate({
        where: {
          userId,
          date: {
            gte: budget.startDate,
            lte: budget.endDate,
          },
        },
        _sum: { amount: true },
      })

      const spent = expenses._sum.amount || 0
      const percentage = (spent / budget.totalAmount) * 100

      if (percentage >= 80) {
        alerts.push({
          budgetId: budget.id,
          budgetName: budget.name,
          totalAmount: budget.totalAmount,
          spent,
          percentage: Math.round(percentage),
          isOverBudget: spent > budget.totalAmount,
          severity: spent > budget.totalAmount ? 'critical' : percentage >= 90 ? 'warning' : 'info',
        })
      }
    }

    return alerts
  }
}

export const analyticsService = new AnalyticsService()
