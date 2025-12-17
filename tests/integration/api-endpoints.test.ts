import request from 'supertest'
import app from '../../src/app'
import { prisma } from '../../src/config/database'

describe('API Endpoints Integration Tests', () => {
  let authToken: string

  beforeAll(async () => {
    // Mock auth token
    authToken = 'Bearer test-token'
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Deals API', () => {
    describe('GET /api/v1/deals/nearby', () => {
      it('should return 401 without authentication', async () => {
        const response = await request(app).get(
          '/api/v1/deals/nearby?lat=41.0082&lng=28.9784&radius=5'
        )

        expect(response.status).toBe(401)
      })

      it('should return nearby deals with valid parameters', async () => {
        const mockDeals = [
          {
            id: 'deal1',
            product: 'Olive oil',
            store: 'Migros',
            oldPrice: 280,
            newPrice: 210,
            discount: 25,
            location: { lat: 41.0082, lng: 28.9784 },
            validUntil: new Date('2025-12-31'),
            imageUrl: null,
            category: 'Groceries',
            createdAt: new Date(),
          },
        ]

        ;(prisma.deal.findMany as jest.Mock).mockResolvedValue(mockDeals)

        const response = await request(app)
          .get('/api/v1/deals/nearby?lat=41.0082&lng=28.9784&radius=5')
          .set('Authorization', authToken)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('success', true)
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.meta).toHaveProperty('radius', 5)
      })

      it('should validate latitude and longitude', async () => {
        const response = await request(app)
          .get('/api/v1/deals/nearby?radius=5')
          .set('Authorization', authToken)

        expect(response.status).toBe(400)
        expect(response.body.message).toContain('latitude and longitude')
      })

      it('should validate radius parameter', async () => {
        const response = await request(app)
          .get('/api/v1/deals/nearby?lat=41.0082&lng=28.9784&radius=100')
          .set('Authorization', authToken)

        expect(response.status).toBe(400)
        expect(response.body.message).toContain('0 and 50')
      })
    })

    describe('GET /api/v1/deals/category/:categoryName', () => {
      it('should return deals by category', async () => {
        const mockDeals = [
          {
            id: 'deal1',
            product: 'Product',
            store: 'Store',
            oldPrice: 100,
            newPrice: 80,
            discount: 20,
            location: {},
            validUntil: new Date('2025-12-31'),
            imageUrl: null,
            category: 'Groceries',
            createdAt: new Date(),
          },
        ]

        ;(prisma.deal.findMany as jest.Mock).mockResolvedValue(mockDeals)

        const response = await request(app)
          .get('/api/v1/deals/category/Groceries')
          .set('Authorization', authToken)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('success', true)
        expect(response.body.meta).toHaveProperty('category', 'Groceries')
      })
    })

    describe('POST /api/v1/deals/track', () => {
      it('should track a deal for user', async () => {
        const mockDeal = {
          id: 'deal1',
          product: 'Product',
          store: 'Store',
          oldPrice: 100,
          newPrice: 80,
          discount: 20,
          location: {},
          validUntil: new Date('2025-12-31'),
          imageUrl: null,
          category: 'Groceries',
          createdAt: new Date(),
        }

        ;(prisma.deal.findUnique as jest.Mock).mockResolvedValue(mockDeal)
        ;(prisma.userDeal.upsert as jest.Mock).mockResolvedValue({})

        const response = await request(app)
          .post('/api/v1/deals/track')
          .set('Authorization', authToken)
          .send({ dealId: 'deal1' })

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('success', true)
        expect(response.body.message).toContain('saved successfully')
      })

      it('should return 400 without dealId', async () => {
        const response = await request(app)
          .post('/api/v1/deals/track')
          .set('Authorization', authToken)
          .send({})

        expect(response.status).toBe(400)
        expect(response.body.message).toContain('Deal ID is required')
      })
    })
  })

  describe('Tips API', () => {
    describe('GET /api/v1/tips', () => {
      it('should return 401 without authentication', async () => {
        const response = await request(app).get('/api/v1/tips')

        expect(response.status).toBe(401)
      })

      it('should return all tips', async () => {
        const mockTips = [
          {
            id: 'tip1',
            title: 'Tip 1',
            description: 'Description',
            icon: '💡',
            priority: 'HIGH',
            category: 'CRYPTO',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]

        ;(prisma.savingsTip.findMany as jest.Mock).mockResolvedValue(mockTips)

        const response = await request(app).get('/api/v1/tips').set('Authorization', authToken)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('success', true)
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.meta).toHaveProperty('total')
      })

      it('should filter tips by priority', async () => {
        const mockTips = [
          {
            id: 'tip1',
            title: 'High Priority Tip',
            description: 'Description',
            icon: '💡',
            priority: 'HIGH',
            category: 'CRYPTO',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]

        ;(prisma.savingsTip.findMany as jest.Mock).mockResolvedValue(mockTips)

        const response = await request(app)
          .get('/api/v1/tips?priority=HIGH')
          .set('Authorization', authToken)

        expect(response.status).toBe(200)
        expect(response.body.meta.filters.priority).toBe('HIGH')
      })

      it('should validate priority parameter', async () => {
        const response = await request(app)
          .get('/api/v1/tips?priority=INVALID')
          .set('Authorization', authToken)

        expect(response.status).toBe(400)
        expect(response.body.message).toContain('HIGH, MEDIUM, or LOW')
      })
    })

    describe('GET /api/v1/tips/personalized', () => {
      it('should return personalized tips', async () => {
        ;(prisma.expense.findMany as jest.Mock).mockResolvedValue([])
        ;(prisma.savingsTip.findMany as jest.Mock).mockResolvedValue([])
        ;(prisma.userTip.findMany as jest.Mock).mockResolvedValue([])

        const response = await request(app)
          .get('/api/v1/tips/personalized')
          .set('Authorization', authToken)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('success', true)
        expect(response.body.meta).toHaveProperty('personalized', true)
      })
    })

    describe('POST /api/v1/tips/:tipId/feedback', () => {
      it('should submit feedback for a tip', async () => {
        ;(prisma.userTip.upsert as jest.Mock).mockResolvedValue({})

        const response = await request(app)
          .post('/api/v1/tips/tip1/feedback')
          .set('Authorization', authToken)
          .send({ helpful: true })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('success', true)
        expect(response.body.message).toContain('submitted successfully')
      })

      it('should handle dismiss feedback', async () => {
        ;(prisma.userTip.upsert as jest.Mock).mockResolvedValue({})

        const response = await request(app)
          .post('/api/v1/tips/tip1/feedback')
          .set('Authorization', authToken)
          .send({ helpful: false, dismiss: true })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('success', true)
      })
    })

    describe('POST /api/v1/tips/:tipId/view', () => {
      it('should mark tip as viewed', async () => {
        ;(prisma.userTip.upsert as jest.Mock).mockResolvedValue({})

        const response = await request(app)
          .post('/api/v1/tips/tip1/view')
          .set('Authorization', authToken)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('success', true)
        expect(response.body.message).toContain('viewed')
      })
    })
  })

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/v1/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'success')
      expect(response.body).toHaveProperty('timestamp')
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/v1/nonexistent')

      expect(response.status).toBe(404)
    })

    it('should handle server errors gracefully', async () => {
      // Mock a service to throw an error
      ;(prisma.savingsTip.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const response = await request(app).get('/api/v1/tips').set('Authorization', authToken)

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('success', false)
    })
  })
})
