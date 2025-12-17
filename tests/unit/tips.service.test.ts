import tipsService from '../../src/services/tips.service'
import { prisma } from '../../src/config/database'
import { Priority } from '@prisma/client'

describe('TipsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllTips', () => {
    it('should return all active tips', async () => {
      const mockTips = [
        {
          id: 'tip1',
          title: 'Consider USDT for savings',
          description: 'Convert 20% of savings to stablecoins',
          icon: '🪙',
          priority: Priority.HIGH,
          category: 'CRYPTO',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'tip2',
          title: 'Buy groceries at discount stores',
          description: 'Shop at Şok or BİM for savings',
          icon: '🛍️',
          priority: Priority.HIGH,
          category: 'RETAIL',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.savingsTip.findMany as jest.Mock).mockResolvedValue(mockTips)

      const tips = await tipsService.getAllTips()

      expect(prisma.savingsTip.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      })
      expect(tips).toHaveLength(2)
      expect(tips[0].title).toBe('Consider USDT for savings')
    })

    it('should only return active tips', async () => {
      const mockTips = [
        {
          id: 'tip1',
          title: 'Active tip',
          description: 'Description',
          icon: '💡',
          priority: Priority.HIGH,
          category: 'GENERAL',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.savingsTip.findMany as jest.Mock).mockResolvedValue(mockTips)

      const tips = await tipsService.getAllTips()

      expect(tips.every((tip) => tip.isActive)).toBe(true)
    })
  })

  describe('generatePersonalizedTips', () => {
    it('should generate personalized tips based on spending', async () => {
      const mockExpenses = [
        {
          id: 'exp1',
          userId: 'user1',
          amount: 6000,
          date: new Date(),
          description: 'Grocery shopping',
          categoryId: 'cat1',
          budgetId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: {
            id: 'cat1',
            name: 'Groceries',
            icon: '🛒',
            userId: 'user1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: 'exp2',
          userId: 'user1',
          amount: 2500,
          date: new Date(),
          description: 'Uber ride',
          categoryId: 'cat2',
          budgetId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: {
            id: 'cat2',
            name: 'Transportation',
            icon: '🚌',
            userId: 'user1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ]

      const mockTips = [
        {
          id: 'tip1',
          title: 'Shop at discount stores',
          description: 'Save on groceries',
          icon: '🛍️',
          priority: Priority.HIGH,
          category: 'RETAIL',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'tip2',
          title: 'Use public transport',
          description: 'Save on transportation',
          icon: '🚌',
          priority: Priority.MEDIUM,
          category: 'TRANSPORT',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses)
      ;(prisma.savingsTip.findMany as jest.Mock).mockResolvedValue(mockTips)
      ;(prisma.userTip.findMany as jest.Mock).mockResolvedValue([])

      const personalizedTips = await tipsService.generatePersonalizedTips('user1')

      expect(personalizedTips.length).toBeGreaterThan(0)
      expect(personalizedTips.length).toBeLessThanOrEqual(10)
    })

    it('should filter out dismissed tips', async () => {
      const mockExpenses = []
      const mockTips = [
        {
          id: 'tip1',
          title: 'Tip 1',
          description: 'Description',
          icon: '💡',
          priority: Priority.HIGH,
          category: 'BANKING',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'tip2',
          title: 'Tip 2',
          description: 'Description',
          icon: '💡',
          priority: Priority.HIGH,
          category: 'CRYPTO',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const mockUserTips = [
        {
          id: 'usertip1',
          userId: 'user1',
          tipId: 'tip1',
          viewed: true,
          helpful: null,
          dismissed: true, // This tip is dismissed
          viewedAt: new Date(),
        },
      ]

      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses)
      ;(prisma.savingsTip.findMany as jest.Mock).mockResolvedValue(mockTips)
      ;(prisma.userTip.findMany as jest.Mock).mockResolvedValue(mockUserTips)

      const personalizedTips = await tipsService.generatePersonalizedTips('user1')

      // Should not include dismissed tip
      expect(personalizedTips.find((t) => t.id === 'tip1')).toBeUndefined()
      expect(personalizedTips.find((t) => t.id === 'tip2')).toBeDefined()
    })

    it('should limit to 10 tips', async () => {
      const mockExpenses = []
      const mockTips = Array.from({ length: 15 }, (_, i) => ({
        id: `tip${i}`,
        title: `Tip ${i}`,
        description: 'Description',
        icon: '💡',
        priority: Priority.HIGH,
        category: 'BANKING',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      ;(prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses)
      ;(prisma.savingsTip.findMany as jest.Mock).mockResolvedValue(mockTips)
      ;(prisma.userTip.findMany as jest.Mock).mockResolvedValue([])

      const personalizedTips = await tipsService.generatePersonalizedTips('user1')

      expect(personalizedTips.length).toBeLessThanOrEqual(10)
    })
  })

  describe('markTipAsViewed', () => {
    it('should mark tip as viewed for user', async () => {
      const mockUserTip = {
        id: 'usertip1',
        userId: 'user1',
        tipId: 'tip1',
        viewed: true,
        helpful: null,
        dismissed: false,
        viewedAt: new Date(),
      }

      ;(prisma.userTip.upsert as jest.Mock).mockResolvedValue(mockUserTip)

      await tipsService.markTipAsViewed('user1', 'tip1')

      expect(prisma.userTip.upsert).toHaveBeenCalledWith({
        where: {
          userId_tipId: {
            userId: 'user1',
            tipId: 'tip1',
          },
        },
        update: {
          viewed: true,
          viewedAt: expect.any(Date),
        },
        create: {
          userId: 'user1',
          tipId: 'tip1',
          viewed: true,
          viewedAt: expect.any(Date),
        },
      })
    })
  })

  describe('submitTipFeedback', () => {
    it('should submit helpful feedback', async () => {
      const mockUserTip = {
        id: 'usertip1',
        userId: 'user1',
        tipId: 'tip1',
        viewed: true,
        helpful: true,
        dismissed: false,
        viewedAt: new Date(),
      }

      ;(prisma.userTip.upsert as jest.Mock).mockResolvedValue(mockUserTip)

      await tipsService.submitTipFeedback('user1', 'tip1', true)

      expect(prisma.userTip.upsert).toHaveBeenCalledWith({
        where: {
          userId_tipId: {
            userId: 'user1',
            tipId: 'tip1',
          },
        },
        update: {
          helpful: true,
          viewed: true,
        },
        create: {
          userId: 'user1',
          tipId: 'tip1',
          viewed: true,
          helpful: true,
        },
      })
    })

    it('should submit not helpful feedback', async () => {
      const mockUserTip = {
        id: 'usertip1',
        userId: 'user1',
        tipId: 'tip1',
        viewed: true,
        helpful: false,
        dismissed: false,
        viewedAt: new Date(),
      }

      ;(prisma.userTip.upsert as jest.Mock).mockResolvedValue(mockUserTip)

      await tipsService.submitTipFeedback('user1', 'tip1', false)

      expect(prisma.userTip.upsert).toHaveBeenCalledWith({
        where: {
          userId_tipId: {
            userId: 'user1',
            tipId: 'tip1',
          },
        },
        update: {
          helpful: false,
          viewed: true,
        },
        create: {
          userId: 'user1',
          tipId: 'tip1',
          viewed: true,
          helpful: false,
        },
      })
    })
  })

  describe('dismissTip', () => {
    it('should dismiss tip for user', async () => {
      const mockUserTip = {
        id: 'usertip1',
        userId: 'user1',
        tipId: 'tip1',
        viewed: true,
        helpful: null,
        dismissed: true,
        viewedAt: new Date(),
      }

      ;(prisma.userTip.upsert as jest.Mock).mockResolvedValue(mockUserTip)

      await tipsService.dismissTip('user1', 'tip1')

      expect(prisma.userTip.upsert).toHaveBeenCalledWith({
        where: {
          userId_tipId: {
            userId: 'user1',
            tipId: 'tip1',
          },
        },
        update: {
          dismissed: true,
        },
        create: {
          userId: 'user1',
          tipId: 'tip1',
          viewed: true,
          dismissed: true,
        },
      })
    })
  })

  describe('getTipsByPriority', () => {
    it('should return tips filtered by priority', async () => {
      const mockTips = [
        {
          id: 'tip1',
          title: 'High priority tip',
          description: 'Description',
          icon: '🔴',
          priority: Priority.HIGH,
          category: 'GENERAL',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.savingsTip.findMany as jest.Mock).mockResolvedValue(mockTips)

      const tips = await tipsService.getTipsByPriority(Priority.HIGH)

      expect(prisma.savingsTip.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          priority: Priority.HIGH,
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(tips).toHaveLength(1)
      expect(tips[0].priority).toBe(Priority.HIGH)
    })
  })

  describe('getTipsByCategory', () => {
    it('should return tips filtered by category', async () => {
      const mockTips = [
        {
          id: 'tip1',
          title: 'Crypto tip',
          description: 'Description',
          icon: '🪙',
          priority: Priority.HIGH,
          category: 'CRYPTO',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.savingsTip.findMany as jest.Mock).mockResolvedValue(mockTips)

      const tips = await tipsService.getTipsByCategory('CRYPTO')

      expect(prisma.savingsTip.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          category: { contains: 'CRYPTO', mode: 'insensitive' },
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      })
      expect(tips).toHaveLength(1)
      expect(tips[0].category).toBe('CRYPTO')
    })

    it('should handle case-insensitive category search', async () => {
      const mockTips = [
        {
          id: 'tip1',
          title: 'Banking tip',
          description: 'Description',
          icon: '🏦',
          priority: Priority.MEDIUM,
          category: 'BANKING',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.savingsTip.findMany as jest.Mock).mockResolvedValue(mockTips)

      const tips = await tipsService.getTipsByCategory('banking')

      expect(tips).toHaveLength(1)
    })
  })

  describe('createTip', () => {
    it('should create a new tip', async () => {
      const tipData = {
        title: 'New tip',
        description: 'Description',
        icon: '💡',
        priority: Priority.MEDIUM,
        category: 'GENERAL',
      }

      const mockCreatedTip = {
        id: 'tip1',
        ...tipData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.savingsTip.create as jest.Mock).mockResolvedValue(mockCreatedTip)

      const createdTip = await tipsService.createTip(tipData)

      expect(prisma.savingsTip.create).toHaveBeenCalledWith({
        data: {
          ...tipData,
          isActive: true,
        },
      })
      expect(createdTip.title).toBe('New tip')
      expect(createdTip.isActive).toBe(true)
    })
  })

  describe('trackTipEffectiveness', () => {
    it('should return effectiveness statistics', async () => {
      const mockUserTips = [
        {
          id: 'usertip1',
          userId: 'user1',
          tipId: 'tip1',
          viewed: true,
          helpful: true,
          dismissed: false,
          viewedAt: new Date(),
        },
        {
          id: 'usertip2',
          userId: 'user2',
          tipId: 'tip1',
          viewed: true,
          helpful: false,
          dismissed: false,
          viewedAt: new Date(),
        },
        {
          id: 'usertip3',
          userId: 'user3',
          tipId: 'tip1',
          viewed: false,
          helpful: null,
          dismissed: true,
          viewedAt: new Date(),
        },
      ]

      ;(prisma.userTip.findMany as jest.Mock).mockResolvedValue(mockUserTips)

      const stats = await tipsService.trackTipEffectiveness('tip1')

      expect(stats.totalViews).toBe(2) // Only 2 viewed
      expect(stats.helpfulVotes).toBe(1)
      expect(stats.notHelpfulVotes).toBe(1)
      expect(stats.dismissals).toBe(1)
      expect(stats.helpfulPercentage).toBe(50) // 1 out of 2 found helpful
    })

    it('should handle tip with no interactions', async () => {
      ;(prisma.userTip.findMany as jest.Mock).mockResolvedValue([])

      const stats = await tipsService.trackTipEffectiveness('tip1')

      expect(stats.totalViews).toBe(0)
      expect(stats.helpfulVotes).toBe(0)
      expect(stats.notHelpfulVotes).toBe(0)
      expect(stats.dismissals).toBe(0)
      expect(stats.helpfulPercentage).toBe(0)
    })
  })
})
