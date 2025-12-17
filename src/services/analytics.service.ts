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

  /**
   * Get comprehensive analytics summary for a given month
   * Used for Expenses analytics tab
   */
  async getAnalyticsSummary(userId: string, month: string) {
    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0, 23, 59, 59)

    // Get all expenses for the month
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
      orderBy: { date: 'asc' },
    })

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)

    // 1. Spending by Category (Pie/Donut Chart)
    const categoryMap = new Map<string, { category: string; amount: number; percentage: number }>()
    expenses.forEach((exp) => {
      const categoryName = exp.category?.name || 'Uncategorized'
      const current = categoryMap.get(categoryName) || { category: categoryName, amount: 0, percentage: 0 }
      categoryMap.set(categoryName, {
        category: categoryName,
        amount: current.amount + exp.amount,
        percentage: 0, // will calculate later
      })
    })

    const spendingByCategory = Array.from(categoryMap.values())
      .map((item) => ({
        ...item,
        percentage: totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    // 2. Daily Spending (Bar Chart)
    const daysInMonth = endDate.getDate()
    const dailySpending: Array<{ date: string; amount: number }> = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayExpenses = expenses.filter((exp) => {
        const expDate = new Date(exp.date)
        return expDate.getDate() === day
      })
      const dayTotal = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      dailySpending.push({ date: dateStr, amount: Math.round(dayTotal * 100) / 100 })
    }

    // 3. Category Comparison (Budget vs Spent)
    const activeBudget = await prisma.budget.findFirst({
      where: {
        userId,
        isActive: true,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      include: {
        categoryBudgets: {
          include: {
            category: true,
          },
        },
      },
    })

    let categoryComparison: Array<{
      category: string
      budget: number
      spent: number
      percentage: number
      status: 'on_track' | 'warning' | 'over'
    }> = []

    if (activeBudget) {
      const categorySpentMap = new Map<string, number>()
      expenses.forEach((exp) => {
        const catId = exp.categoryId
        categorySpentMap.set(catId, (categorySpentMap.get(catId) || 0) + exp.amount)
      })

      categoryComparison = activeBudget.categoryBudgets.map((cb) => {
        const spent = categorySpentMap.get(cb.categoryId) || 0
        const percentage = cb.amount > 0 ? (spent / cb.amount) * 100 : 0
        let status: 'on_track' | 'warning' | 'over' = 'on_track'
        if (percentage >= 100) status = 'over'
        else if (percentage >= 80) status = 'warning'

        return {
          category: cb.category.name,
          budget: cb.amount,
          spent: Math.round(spent * 100) / 100,
          percentage: Math.round(percentage * 10) / 10,
          status,
        }
      })
    }

    // 4. Stats
    const dailyAmounts = dailySpending.map((d) => d.amount).filter((a) => a > 0)
    const busiestDayData = dailySpending.reduce((max, day) => (day.amount > max.amount ? day : max), dailySpending[0])

    const merchantMap = new Map<string, number>()
    expenses.forEach((exp) => {
      const merchant = exp.description || 'Unknown'
      merchantMap.set(merchant, (merchantMap.get(merchant) || 0) + 1)
    })
    const mostFrequentMerchantEntry = Array.from(merchantMap.entries()).sort((a, b) => b[1] - a[1])[0]

    const stats = {
      busiestDay: {
        date: busiestDayData?.date || '',
        amount: Math.round((busiestDayData?.amount || 0) * 100) / 100,
      },
      topCategory: {
        name: spendingByCategory[0]?.category || 'None',
        amount: Math.round((spendingByCategory[0]?.amount || 0) * 100) / 100,
      },
      mostFrequentMerchant: {
        name: mostFrequentMerchantEntry?.[0] || 'None',
        count: mostFrequentMerchantEntry?.[1] || 0,
      },
      averageTransaction: expenses.length > 0 ? Math.round((totalSpent / expenses.length) * 100) / 100 : 0,
    }

    return {
      spendingByCategory,
      dailySpending,
      categoryComparison,
      stats,
    }
  }
}

export const analyticsService = new AnalyticsService()
