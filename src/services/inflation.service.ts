import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

export interface InflationData {
  currentRate: number
  predictedRate: number | null
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
  categoryRates?: Record<string, number>
}

export class InflationService {
  /**
   * Fetch Turkey inflation data from TÜİK (Turkish Statistical Institute)
   * Falls back to stored data if API is unavailable
   */
  async fetchTurkeyInflationData(): Promise<InflationData | null> {
    try {
      // Note: TÜİK API requires authentication and has rate limits
      // For production, you would integrate with their official API
      // For now, we'll use the stored data from the database

      const latestRate = await prisma.inflationRate.findFirst({
        orderBy: { date: 'desc' },
      })

      if (!latestRate) {
        return null
      }

      return {
        currentRate: latestRate.rate,
        predictedRate: latestRate.predictedRate,
        trend: latestRate.trend as 'up' | 'down' | 'stable',
        lastUpdated: latestRate.date.toISOString(),
        categoryRates: latestRate.categoryRates as Record<string, number> | undefined,
      }
    } catch (error) {
      console.error('Error fetching inflation data:', error)
      throw new Error('Failed to fetch inflation data')
    }
  }

  /**
   * Get historical inflation data for the past N months
   */
  async getHistoricalData(months: number = 6): Promise<InflationData[]> {
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      const rates = await prisma.inflationRate.findMany({
        where: {
          date: {
            gte: startDate,
          },
        },
        orderBy: {
          date: 'desc',
        },
      })

      return rates.map((rate) => ({
        currentRate: rate.rate,
        predictedRate: rate.predictedRate,
        trend: rate.trend as 'up' | 'down' | 'stable',
        lastUpdated: rate.date.toISOString(),
        categoryRates: rate.categoryRates as Record<string, number> | undefined,
      }))
    } catch (error) {
      console.error('Error fetching historical inflation data:', error)
      throw new Error('Failed to fetch historical inflation data')
    }
  }

  /**
   * Predict inflation rate for next N months using simple linear regression
   */
  async predictNextMonths(months: number = 3): Promise<number[]> {
    try {
      // Get last 6 months of data for prediction
      const historicalData = await this.getHistoricalData(6)

      if (historicalData.length < 2) {
        throw new Error('Insufficient data for prediction')
      }

      const rates = historicalData.map((d) => d.currentRate).reverse()
      const predictions: number[] = []

      // Simple linear regression
      for (let i = 0; i < months; i++) {
        const predicted = this.simpleLinearForecast(rates, 1)[0]
        predictions.push(predicted)
        rates.push(predicted) // Add prediction to dataset for next iteration
      }

      return predictions
    } catch (error) {
      console.error('Error predicting inflation:', error)
      throw new Error('Failed to predict inflation rates')
    }
  }

  /**
   * Calculate inflation impact on user's budget
   */
  async calculateBudgetImpact(
    userId: string,
    budgetId?: string
  ): Promise<{
    totalImpact: number
    categoryImpacts: Array<{
      category: string
      currentSpending: number
      adjustedSpending: number
      impact: number
      impactPercentage: number
    }>
  }> {
    try {
      // Get current inflation rates by category
      const latestRate = await prisma.inflationRate.findFirst({
        orderBy: { date: 'desc' },
      })

      if (!latestRate) {
        throw new Error('No inflation data available')
      }

      const categoryRates = (latestRate.categoryRates as Record<string, number>) || {}

      // Get user's budget
      const budget = budgetId
        ? await prisma.budget.findUnique({
            where: { id: budgetId },
            include: {
              categoryBudgets: {
                include: { category: true },
              },
            },
          })
        : await prisma.budget.findFirst({
            where: {
              userId,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
            include: {
              categoryBudgets: {
                include: { category: true },
              },
            },
          })

      if (!budget) {
        throw new Error('No active budget found')
      }

      // Calculate impact for each category
      const categoryImpacts = budget.categoryBudgets.map((cb) => {
        const categoryName = cb.category.name.toLowerCase()
        const inflationRate = categoryRates[categoryName] || latestRate.rate
        const currentSpending = cb.amount
        const adjustedSpending = currentSpending * (1 + inflationRate / 100)
        const impact = adjustedSpending - currentSpending

        return {
          category: cb.category.name,
          currentSpending,
          adjustedSpending: Math.round(adjustedSpending * 100) / 100,
          impact: Math.round(impact * 100) / 100,
          impactPercentage: Math.round((impact / currentSpending) * 100 * 100) / 100,
        }
      })

      const totalImpact = categoryImpacts.reduce((sum, cat) => sum + cat.impact, 0)

      return {
        totalImpact: Math.round(totalImpact * 100) / 100,
        categoryImpacts,
      }
    } catch (error) {
      console.error('Error calculating budget impact:', error)
      throw new Error('Failed to calculate budget impact')
    }
  }

  /**
   * Calculate category-specific inflation rate
   */
  async calculateCategoryInflation(category: string): Promise<number> {
    try {
      const latestRate = await prisma.inflationRate.findFirst({
        orderBy: { date: 'desc' },
      })

      if (!latestRate) {
        throw new Error('No inflation data available')
      }

      const categoryRates = (latestRate.categoryRates as Record<string, number>) || {}
      return categoryRates[category.toLowerCase()] || latestRate.rate
    } catch (error) {
      console.error('Error calculating category inflation:', error)
      throw new Error('Failed to calculate category inflation')
    }
  }

  /**
   * Store new inflation data in database
   */
  async storeInflationData(data: {
    date: Date
    rate: number
    predictedRate?: number
    trend: string
    source: string
    categoryRates?: Record<string, number>
  }): Promise<void> {
    try {
      await prisma.inflationRate.upsert({
        where: { date: data.date },
        update: {
          rate: data.rate,
          predictedRate: data.predictedRate,
          trend: data.trend,
          source: data.source,
          categoryRates: data.categoryRates as any,
        },
        create: data as any,
      })
    } catch (error) {
      console.error('Error storing inflation data:', error)
      throw new Error('Failed to store inflation data')
    }
  }

  /**
   * Simple linear regression forecast
   */
  private simpleLinearForecast(data: number[], periods: number): number[] {
    const n = data.length
    if (n === 0) return []

    // Calculate linear regression parameters
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumX2 = 0

    for (let i = 0; i < n; i++) {
      sumX += i
      sumY += data[i]
      sumXY += i * data[i]
      sumX2 += i * i
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Generate forecasts
    const forecasts: number[] = []
    for (let i = 0; i < periods; i++) {
      const forecast = intercept + slope * (n + i)
      forecasts.push(Math.max(0, forecast)) // Ensure non-negative
    }

    return forecasts
  }
}

export default new InflationService()
