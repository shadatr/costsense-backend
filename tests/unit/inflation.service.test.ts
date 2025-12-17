import inflationService from '../../src/services/inflation.service'
import { prisma } from '../../src/config/database'

// Mock axios for external API calls
jest.mock('axios')

describe('InflationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchTurkeyInflationData', () => {
    it('should return mock inflation data', async () => {
      const result = await inflationService.fetchTurkeyInflationData()

      expect(result).toBeDefined()
      expect(result.currentRate).toBeGreaterThan(0)
      expect(result.trend).toMatch(/up|down|stable/)
      expect(result.categoryRates).toBeDefined()
      expect(result.categoryRates.food).toBeGreaterThan(0)
    })

    it('should include all required category rates', async () => {
      const result = await inflationService.fetchTurkeyInflationData()

      expect(result.categoryRates).toHaveProperty('food')
      expect(result.categoryRates).toHaveProperty('housing')
      expect(result.categoryRates).toHaveProperty('transport')
      expect(result.categoryRates).toHaveProperty('healthcare')
    })
  })

  describe('getHistoricalData', () => {
    it('should retrieve historical inflation data', async () => {
      const mockData = [
        {
          id: '1',
          date: new Date('2025-01-01'),
          rate: 64.8,
          predictedRate: 65.0,
          trend: 'up',
          source: 'TÜİK',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          date: new Date('2024-12-01'),
          rate: 62.5,
          predictedRate: 63.0,
          trend: 'up',
          source: 'TÜİK',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.inflationRate.findMany as jest.Mock).mockResolvedValue(mockData)

      const result = await inflationService.getHistoricalData(2)

      expect(prisma.inflationRate.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'desc' },
        take: 2,
      })
      expect(result).toHaveLength(2)
      expect(result[0].currentRate).toBe(64.8)
    })

    it('should return empty array if no data exists', async () => {
      ;(prisma.inflationRate.findMany as jest.Mock).mockResolvedValue([])

      const result = await inflationService.getHistoricalData(6)

      expect(result).toEqual([])
    })
  })

  describe('predictNextMonths', () => {
    it('should throw error if insufficient data', async () => {
      ;(prisma.inflationRate.findMany as jest.Mock).mockResolvedValue([
        {
          id: '1',
          date: new Date(),
          rate: 64.8,
          predictedRate: null,
          trend: 'up',
          source: 'TÜİK',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])

      await expect(inflationService.predictNextMonths(3)).rejects.toThrow(
        'Insufficient data for prediction'
      )
    })

    it('should predict next months based on historical data', async () => {
      const mockHistoricalData = [
        {
          id: '1',
          date: new Date('2025-01-01'),
          rate: 64.8,
          predictedRate: null,
          trend: 'up',
          source: 'TÜİK',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          date: new Date('2024-12-01'),
          rate: 62.5,
          predictedRate: null,
          trend: 'up',
          source: 'TÜİK',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          date: new Date('2024-11-01'),
          rate: 60.2,
          predictedRate: null,
          trend: 'up',
          source: 'TÜİK',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.inflationRate.findMany as jest.Mock).mockResolvedValue(mockHistoricalData)

      const predictions = await inflationService.predictNextMonths(2)

      expect(predictions).toHaveLength(2)
      expect(predictions[0]).toBeGreaterThan(64.8) // Should predict higher
    })
  })

  describe('calculateBudgetImpact', () => {
    it('should calculate inflation impact on user budget', async () => {
      const mockBudget = {
        id: 'budget1',
        userId: 'user1',
        name: 'Monthly Budget',
        amount: 10000,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockInflation = {
        id: '1',
        date: new Date(),
        rate: 64.8,
        predictedRate: 67.2,
        trend: 'up',
        source: 'TÜİK',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.budget.findFirst as jest.Mock).mockResolvedValue(mockBudget)
      ;(prisma.inflationRate.findFirst as jest.Mock).mockResolvedValue(mockInflation)

      const result = await inflationService.calculateBudgetImpact('user1')

      expect(result).toBeDefined()
      expect(result.currentInflation).toBe(64.8)
      expect(result.predictedInflation).toBe(67.2)
      expect(result.budgetAmount).toBe(10000)
      expect(result.estimatedImpact).toBeGreaterThan(0)
    })

    it('should throw error if no active budget found', async () => {
      ;(prisma.budget.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(inflationService.calculateBudgetImpact('user1')).rejects.toThrow(
        'No active budget found'
      )
    })

    it('should throw error if no inflation data available', async () => {
      const mockBudget = {
        id: 'budget1',
        userId: 'user1',
        name: 'Monthly Budget',
        amount: 10000,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.budget.findFirst as jest.Mock).mockResolvedValue(mockBudget)
      ;(prisma.inflationRate.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(inflationService.calculateBudgetImpact('user1')).rejects.toThrow(
        'No inflation data available'
      )
    })
  })

  describe('calculateCategoryInflation', () => {
    it('should return category-specific inflation rate', async () => {
      const rate = await inflationService.calculateCategoryInflation('food')

      expect(rate).toBeGreaterThan(0)
      expect(typeof rate).toBe('number')
    })

    it('should handle various category names', async () => {
      const categories = ['food', 'housing', 'transport', 'healthcare']

      for (const category of categories) {
        const rate = await inflationService.calculateCategoryInflation(category)
        expect(rate).toBeGreaterThan(0)
      }
    })
  })

  describe('storeInflationData', () => {
    it('should store inflation data in database', async () => {
      const mockCreated = {
        id: 'inflation1',
        date: new Date(),
        rate: 64.8,
        predictedRate: 67.2,
        trend: 'up',
        source: 'TÜİK',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.inflationRate.create as jest.Mock).mockResolvedValue(mockCreated)

      const data = {
        date: new Date(),
        rate: 64.8,
        predictedRate: 67.2,
        trend: 'up' as const,
        source: 'TÜİK',
        categoryRates: {
          food: 72.1,
          housing: 62.5,
          transport: 58.9,
          healthcare: 54.7,
        },
      }

      await inflationService.storeInflationData(data)

      expect(prisma.inflationRate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          date: data.date,
          rate: data.rate,
          predictedRate: data.predictedRate,
          trend: data.trend,
          source: data.source,
        }),
      })
    })
  })
})
