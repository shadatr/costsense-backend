import request from 'supertest'
import app from '../../src/app'
import { prisma } from '../../src/config/database'

describe('Inflation API Integration Tests', () => {
  let authToken: string

  beforeAll(async () => {
    // Mock auth token for testing
    authToken = 'Bearer test-token'
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /api/v1/inflation/current', () => {
    it('should return current inflation rate', async () => {
      const response = await request(app).get('/api/v1/inflation/current')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('currentRate')
      expect(response.body.data).toHaveProperty('predictedRate')
      expect(response.body.data).toHaveProperty('trend')
      expect(response.body.data).toHaveProperty('lastUpdated')
    })

    it('should return inflation data with correct structure', async () => {
      const response = await request(app).get('/api/v1/inflation/current')

      expect(typeof response.body.data.currentRate).toBe('number')
      expect(typeof response.body.data.predictedRate).toBe('number')
      expect(['up', 'down', 'stable']).toContain(response.body.data.trend)
    })
  })

  describe('GET /api/v1/inflation/history', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/inflation/history?months=6')

      expect(response.status).toBe(401)
    })

    it('should return historical data with valid auth token', async () => {
      const mockHistoricalData = [
        {
          id: '1',
          date: new Date(),
          rate: 64.8,
          predictedRate: 65.0,
          trend: 'up',
          source: 'TÜİK',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.inflationRate.findMany as jest.Mock).mockResolvedValue(mockHistoricalData)

      const response = await request(app)
        .get('/api/v1/inflation/history?months=6')
        .set('Authorization', authToken)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body).toHaveProperty('meta')
      expect(response.body.meta).toHaveProperty('months', 6)
    })

    it('should validate months parameter', async () => {
      const response = await request(app)
        .get('/api/v1/inflation/history?months=30')
        .set('Authorization', authToken)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body.message).toContain('1 and 24')
    })

    it('should use default months if not provided', async () => {
      ;(prisma.inflationRate.findMany as jest.Mock).mockResolvedValue([])

      const response = await request(app)
        .get('/api/v1/inflation/history')
        .set('Authorization', authToken)

      expect(response.status).toBe(200)
      expect(response.body.meta).toHaveProperty('months', 6) // Default value
    })
  })

  describe('GET /api/v1/inflation/forecast', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/inflation/forecast?months=3')

      expect(response.status).toBe(401)
    })

    it('should return forecast with valid auth token', async () => {
      const mockHistoricalData = Array.from({ length: 3 }, (_, i) => ({
        id: `${i}`,
        date: new Date(),
        rate: 60 + i,
        predictedRate: null,
        trend: 'up',
        source: 'TÜİK',
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      ;(prisma.inflationRate.findMany as jest.Mock).mockResolvedValue(mockHistoricalData)

      const response = await request(app)
        .get('/api/v1/inflation/forecast?months=3')
        .set('Authorization', authToken)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('predictions')
      expect(Array.isArray(response.body.data.predictions)).toBe(true)
      expect(response.body.data).toHaveProperty('months', 3)
    })

    it('should validate months parameter for forecast', async () => {
      const response = await request(app)
        .get('/api/v1/inflation/forecast?months=15')
        .set('Authorization', authToken)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body.message).toContain('1 and 12')
    })
  })

  describe('POST /api/v1/inflation/impact', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/inflation/impact')
        .send({ budgetId: 'budget1' })

      expect(response.status).toBe(401)
    })

    it('should calculate budget impact with valid auth', async () => {
      const mockBudget = {
        id: 'budget1',
        userId: 'user1',
        name: 'Monthly Budget',
        amount: 10000,
        startDate: new Date(),
        endDate: new Date(),
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

      const response = await request(app)
        .post('/api/v1/inflation/impact')
        .set('Authorization', authToken)
        .send({ budgetId: 'budget1' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('currentInflation')
      expect(response.body.data).toHaveProperty('predictedInflation')
      expect(response.body.data).toHaveProperty('budgetAmount')
      expect(response.body.data).toHaveProperty('estimatedImpact')
    })

    it('should return 404 if no active budget found', async () => {
      ;(prisma.budget.findFirst as jest.Mock).mockResolvedValue(null)

      const response = await request(app)
        .post('/api/v1/inflation/impact')
        .set('Authorization', authToken)
        .send({})

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body.message).toContain('No active budget found')
    })
  })

  describe('GET /api/v1/inflation/category/:categoryName', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/inflation/category/food')

      expect(response.status).toBe(401)
    })

    it('should return category inflation rate', async () => {
      const response = await request(app)
        .get('/api/v1/inflation/category/food')
        .set('Authorization', authToken)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('category', 'food')
      expect(response.body.data).toHaveProperty('inflationRate')
      expect(typeof response.body.data.inflationRate).toBe('number')
    })

    it('should handle various category names', async () => {
      const categories = ['food', 'housing', 'transport', 'healthcare']

      for (const category of categories) {
        const response = await request(app)
          .get(`/api/v1/inflation/category/${category}`)
          .set('Authorization', authToken)

        expect(response.status).toBe(200)
        expect(response.body.data.category).toBe(category)
      }
    })
  })
})
