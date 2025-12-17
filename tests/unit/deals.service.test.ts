import dealsService from '../../src/services/deals.service'
import { prisma } from '../../src/config/database'

describe('DealsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('scrapeStoreDeals', () => {
    it('should scrape deals from multiple stores', async () => {
      const stores = ['Migros', 'BİM']
      const deals = await dealsService.scrapeStoreDeals(stores)

      expect(Array.isArray(deals)).toBe(true)
      expect(deals.length).toBeGreaterThan(0)

      // Verify deal structure
      deals.forEach((deal) => {
        expect(deal).toHaveProperty('product')
        expect(deal).toHaveProperty('store')
        expect(deal).toHaveProperty('oldPrice')
        expect(deal).toHaveProperty('newPrice')
        expect(deal).toHaveProperty('discount')
        expect(deal.oldPrice).toBeGreaterThan(deal.newPrice)
      })
    })

    it('should handle empty store list', async () => {
      const deals = await dealsService.scrapeStoreDeals([])
      expect(deals).toEqual([])
    })

    it('should include all specified stores', async () => {
      const stores = ['Migros', 'BİM', 'Şok', 'A101']
      const deals = await dealsService.scrapeStoreDeals(stores)

      const uniqueStores = [...new Set(deals.map((d) => d.store))]
      expect(uniqueStores.length).toBeGreaterThan(0)

      uniqueStores.forEach((store) => {
        expect(stores).toContain(store)
      })
    })
  })

  describe('findNearbyDeals', () => {
    it('should find deals within specified radius', async () => {
      const mockDeals = [
        {
          id: 'deal1',
          product: 'Olive oil (1L)',
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
        {
          id: 'deal2',
          product: 'Chicken breast (1kg)',
          store: 'BİM',
          oldPrice: 150,
          newPrice: 120,
          discount: 20,
          location: { lat: 41.0100, lng: 28.9800 },
          validUntil: new Date('2025-12-31'),
          imageUrl: null,
          category: 'Groceries',
          createdAt: new Date(),
        },
      ]

      ;(prisma.deal.findMany as jest.Mock).mockResolvedValue(mockDeals)

      const userLocation = { lat: 41.0082, lng: 28.9784 }
      const radius = 5 // km

      const nearbyDeals = await dealsService.findNearbyDeals(userLocation, radius)

      expect(Array.isArray(nearbyDeals)).toBe(true)
      expect(nearbyDeals.length).toBeGreaterThan(0)

      // Verify each deal has distance calculated
      nearbyDeals.forEach((deal) => {
        expect(deal).toHaveProperty('distance')
        expect(typeof deal.distance).toBe('number')
        expect(deal.distance).toBeLessThanOrEqual(radius)
      })
    })

    it('should filter out deals beyond radius', async () => {
      const mockDeals = [
        {
          id: 'deal1',
          product: 'Product 1',
          store: 'Store1',
          oldPrice: 100,
          newPrice: 80,
          discount: 20,
          location: { lat: 41.0082, lng: 28.9784 },
          validUntil: new Date('2025-12-31'),
          imageUrl: null,
          category: 'Groceries',
          createdAt: new Date(),
        },
        {
          id: 'deal2',
          product: 'Product 2',
          store: 'Store2',
          oldPrice: 100,
          newPrice: 80,
          discount: 20,
          location: { lat: 45.0000, lng: 35.0000 }, // Far away
          validUntil: new Date('2025-12-31'),
          imageUrl: null,
          category: 'Groceries',
          createdAt: new Date(),
        },
      ]

      ;(prisma.deal.findMany as jest.Mock).mockResolvedValue(mockDeals)

      const userLocation = { lat: 41.0082, lng: 28.9784 }
      const radius = 1 // 1 km

      const nearbyDeals = await dealsService.findNearbyDeals(userLocation, radius)

      // Should only include close deals
      expect(nearbyDeals.every((deal) => deal.distance! <= radius)).toBe(true)
    })

    it('should sort deals by distance', async () => {
      const mockDeals = [
        {
          id: 'deal1',
          product: 'Product 1',
          store: 'Store1',
          oldPrice: 100,
          newPrice: 80,
          discount: 20,
          location: { lat: 41.0100, lng: 28.9800 }, // Further
          validUntil: new Date('2025-12-31'),
          imageUrl: null,
          category: 'Groceries',
          createdAt: new Date(),
        },
        {
          id: 'deal2',
          product: 'Product 2',
          store: 'Store2',
          oldPrice: 100,
          newPrice: 80,
          discount: 20,
          location: { lat: 41.0082, lng: 28.9784 }, // Closer
          validUntil: new Date('2025-12-31'),
          imageUrl: null,
          category: 'Groceries',
          createdAt: new Date(),
        },
      ]

      ;(prisma.deal.findMany as jest.Mock).mockResolvedValue(mockDeals)

      const userLocation = { lat: 41.0082, lng: 28.9784 }
      const nearbyDeals = await dealsService.findNearbyDeals(userLocation, 10)

      // Verify sorted by distance (ascending)
      for (let i = 0; i < nearbyDeals.length - 1; i++) {
        expect(nearbyDeals[i].distance).toBeLessThanOrEqual(nearbyDeals[i + 1].distance!)
      }
    })
  })

  describe('getDealsByCategory', () => {
    it('should return deals for specified category', async () => {
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

      const deals = await dealsService.getDealsByCategory('Groceries')

      expect(prisma.deal.findMany).toHaveBeenCalledWith({
        where: {
          category: {
            contains: 'Groceries',
            mode: 'insensitive',
          },
          validUntil: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          discount: 'desc',
        },
      })
      expect(deals).toHaveLength(1)
      expect(deals[0].category).toBe('Groceries')
    })

    it('should handle case-insensitive category search', async () => {
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
          category: 'GROCERIES',
          createdAt: new Date(),
        },
      ]

      ;(prisma.deal.findMany as jest.Mock).mockResolvedValue(mockDeals)

      const deals = await dealsService.getDealsByCategory('groceries')

      expect(deals).toHaveLength(1)
    })
  })

  describe('trackDeal', () => {
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

      const mockUserDeal = {
        id: 'userdeal1',
        userId: 'user1',
        dealId: 'deal1',
        used: false,
        savedAt: new Date(),
      }

      ;(prisma.deal.findUnique as jest.Mock).mockResolvedValue(mockDeal)
      ;(prisma.userDeal.upsert as jest.Mock).mockResolvedValue(mockUserDeal)

      await dealsService.trackDeal('user1', 'deal1')

      expect(prisma.deal.findUnique).toHaveBeenCalledWith({
        where: { id: 'deal1' },
      })
      expect(prisma.userDeal.upsert).toHaveBeenCalled()
    })

    it('should throw error if deal not found', async () => {
      ;(prisma.deal.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(dealsService.trackDeal('user1', 'invalid-deal')).rejects.toThrow(
        'Deal not found or expired'
      )
    })

    it('should throw error if deal is expired', async () => {
      const expiredDeal = {
        id: 'deal1',
        product: 'Product',
        store: 'Store',
        oldPrice: 100,
        newPrice: 80,
        discount: 20,
        location: {},
        validUntil: new Date('2020-01-01'), // Expired
        imageUrl: null,
        category: 'Groceries',
        createdAt: new Date(),
      }

      ;(prisma.deal.findUnique as jest.Mock).mockResolvedValue(expiredDeal)

      await expect(dealsService.trackDeal('user1', 'deal1')).rejects.toThrow(
        'Deal not found or expired'
      )
    })
  })

  describe('getUserSavedDeals', () => {
    it('should return user saved deals with deal details', async () => {
      const mockUserDeals = [
        {
          id: 'userdeal1',
          userId: 'user1',
          dealId: 'deal1',
          used: false,
          savedAt: new Date(),
          deal: {
            id: 'deal1',
            product: 'Olive oil',
            store: 'Migros',
            oldPrice: 280,
            newPrice: 210,
            discount: 25,
            location: {},
            validUntil: new Date('2025-12-31'),
            imageUrl: null,
            category: 'Groceries',
            createdAt: new Date(),
          },
        },
      ]

      ;(prisma.userDeal.findMany as jest.Mock).mockResolvedValue(mockUserDeals)

      const savedDeals = await dealsService.getUserSavedDeals('user1')

      expect(prisma.userDeal.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: { deal: true },
        orderBy: { savedAt: 'desc' },
      })
      expect(savedDeals).toHaveLength(1)
      expect(savedDeals[0]).toHaveProperty('deal')
    })

    it('should return empty array if user has no saved deals', async () => {
      ;(prisma.userDeal.findMany as jest.Mock).mockResolvedValue([])

      const savedDeals = await dealsService.getUserSavedDeals('user1')

      expect(savedDeals).toEqual([])
    })
  })

  describe('markDealAsUsed', () => {
    it('should mark a saved deal as used', async () => {
      const mockUserDeal = {
        id: 'userdeal1',
        userId: 'user1',
        dealId: 'deal1',
        used: true,
        savedAt: new Date(),
      }

      ;(prisma.userDeal.upsert as jest.Mock).mockResolvedValue(mockUserDeal)

      await dealsService.markDealAsUsed('user1', 'deal1')

      expect(prisma.userDeal.upsert).toHaveBeenCalledWith({
        where: {
          userId_dealId: {
            userId: 'user1',
            dealId: 'deal1',
          },
        },
        update: { used: true },
        create: {
          userId: 'user1',
          dealId: 'deal1',
          used: true,
        },
      })
    })
  })

  describe('storeDeals', () => {
    it('should store multiple deals in database', async () => {
      const deals = [
        {
          product: 'Product 1',
          store: 'Store1',
          oldPrice: 100,
          newPrice: 80,
          discount: 20,
          location: { lat: 41.0, lng: 29.0 },
          validUntil: new Date('2025-12-31'),
          imageUrl: 'http://example.com/image.jpg',
          category: 'Groceries',
        },
        {
          product: 'Product 2',
          store: 'Store2',
          oldPrice: 200,
          newPrice: 160,
          discount: 20,
          location: { lat: 41.1, lng: 29.1 },
          validUntil: new Date('2025-12-31'),
          imageUrl: null,
          category: 'Electronics',
        },
      ]

      ;(prisma.deal.createMany as jest.Mock).mockResolvedValue({ count: 2 })

      const result = await dealsService.storeDeals(deals)

      expect(prisma.deal.createMany).toHaveBeenCalledWith({
        data: deals,
        skipDuplicates: true,
      })
      expect(result.count).toBe(2)
    })

    it('should handle empty deals array', async () => {
      ;(prisma.deal.createMany as jest.Mock).mockResolvedValue({ count: 0 })

      const result = await dealsService.storeDeals([])

      expect(result.count).toBe(0)
    })
  })
})
