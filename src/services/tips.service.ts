import { PrismaClient, Priority } from '@prisma/client'

const prisma = new PrismaClient()

export interface SavingsTip {
  id: string
  title: string
  description: string
  icon: string
  priority: Priority
  category: string
  isActive: boolean
  viewed?: boolean
  helpful?: boolean | null
}

export class TipsService {
  /**
   * Get all active savings tips
   */
  async getAllTips(): Promise<SavingsTip[]> {
    try {
      const tips = await prisma.savingsTip.findMany({
        where: { isActive: true },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      })

      return tips.map((tip) => ({
        id: tip.id,
        title: tip.title,
        description: tip.description,
        icon: tip.icon,
        priority: tip.priority,
        category: tip.category,
        isActive: tip.isActive,
      }))
    } catch (error) {
      console.error('Error getting all tips:', error)
      throw new Error('Failed to get tips')
    }
  }

  /**
   * Generate personalized tips based on user spending patterns
   */
  async generatePersonalizedTips(userId: string): Promise<SavingsTip[]> {
    try {
      // Get user's spending patterns from last month
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          date: { gte: lastMonth },
        },
        include: { category: true },
      })

      // Analyze spending by category
      const categorySpending: Record<string, number> = {}
      expenses.forEach((expense) => {
        const catName = expense.category.name.toLowerCase()
        categorySpending[catName] = (categorySpending[catName] || 0) + expense.amount
      })

      // Determine relevant tip categories based on spending
      const tipCategories: string[] = []

      if (categorySpending['groceries'] > 5000) {
        tipCategories.push('RETAIL') // High grocery spending
      }
      if (categorySpending['transportation'] > 2000) {
        tipCategories.push('TRANSPORT')
      }
      if (categorySpending['dining'] > 3000) {
        tipCategories.push('DINING')
      }

      // Always show banking and crypto tips (HIGH priority)
      tipCategories.push('BANKING', 'CRYPTO')

      // Get tips from relevant categories
      const tips = await prisma.savingsTip.findMany({
        where: {
          isActive: true,
          category: { in: tipCategories },
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      })

      // Get user's tip interactions
      const userTips = await prisma.userTip.findMany({
        where: { userId },
      })

      const userTipMap = new Map(
        userTips.map((ut) => [ut.tipId, { viewed: ut.viewed, helpful: ut.helpful, dismissed: ut.dismissed }])
      )

      // Filter out dismissed tips and add user interaction data
      const personalizedTips = tips
        .filter((tip) => {
          const userTip = userTipMap.get(tip.id)
          return !userTip?.dismissed
        })
        .map((tip) => {
          const userTip = userTipMap.get(tip.id)
          return {
            id: tip.id,
            title: tip.title,
            description: tip.description,
            icon: tip.icon,
            priority: tip.priority,
            category: tip.category,
            isActive: tip.isActive,
            viewed: userTip?.viewed || false,
            helpful: userTip?.helpful || null,
          }
        })
        .slice(0, 10) // Limit to 10 tips

      return personalizedTips
    } catch (error) {
      console.error('Error generating personalized tips:', error)
      throw new Error('Failed to generate personalized tips')
    }
  }

  /**
   * Mark tip as viewed by user
   */
  async markTipAsViewed(userId: string, tipId: string): Promise<void> {
    try {
      await prisma.userTip.upsert({
        where: {
          userId_tipId: {
            userId,
            tipId,
          },
        },
        update: {
          viewed: true,
          viewedAt: new Date(),
        },
        create: {
          userId,
          tipId,
          viewed: true,
          viewedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Error marking tip as viewed:', error)
      throw new Error('Failed to mark tip as viewed')
    }
  }

  /**
   * Submit feedback on tip (helpful or not)
   */
  async submitTipFeedback(
    userId: string,
    tipId: string,
    helpful: boolean
  ): Promise<void> {
    try {
      await prisma.userTip.upsert({
        where: {
          userId_tipId: {
            userId,
            tipId,
          },
        },
        update: {
          helpful,
          viewed: true,
        },
        create: {
          userId,
          tipId,
          viewed: true,
          helpful,
        },
      })
    } catch (error) {
      console.error('Error submitting tip feedback:', error)
      throw new Error('Failed to submit feedback')
    }
  }

  /**
   * Dismiss a tip (user doesn't want to see it again)
   */
  async dismissTip(userId: string, tipId: string): Promise<void> {
    try {
      await prisma.userTip.upsert({
        where: {
          userId_tipId: {
            userId,
            tipId,
          },
        },
        update: {
          dismissed: true,
        },
        create: {
          userId,
          tipId,
          viewed: true,
          dismissed: true,
        },
      })
    } catch (error) {
      console.error('Error dismissing tip:', error)
      throw new Error('Failed to dismiss tip')
    }
  }

  /**
   * Track tip effectiveness (analytics)
   * Returns aggregated statistics for a tip
   */
  async trackTipEffectiveness(tipId: string): Promise<{
    totalViews: number
    helpfulVotes: number
    notHelpfulVotes: number
    dismissals: number
    helpfulPercentage: number
  }> {
    try {
      const userTips = await prisma.userTip.findMany({
        where: { tipId },
      })

      const totalViews = userTips.filter((ut) => ut.viewed).length
      const helpfulVotes = userTips.filter((ut) => ut.helpful === true).length
      const notHelpfulVotes = userTips.filter((ut) => ut.helpful === false).length
      const dismissals = userTips.filter((ut) => ut.dismissed).length

      const totalFeedback = helpfulVotes + notHelpfulVotes
      const helpfulPercentage =
        totalFeedback > 0 ? Math.round((helpfulVotes / totalFeedback) * 100) : 0

      return {
        totalViews,
        helpfulVotes,
        notHelpfulVotes,
        dismissals,
        helpfulPercentage,
      }
    } catch (error) {
      console.error('Error tracking tip effectiveness:', error)
      throw new Error('Failed to track tip effectiveness')
    }
  }

  /**
   * Get tips by priority level
   */
  async getTipsByPriority(priority: Priority): Promise<SavingsTip[]> {
    try {
      const tips = await prisma.savingsTip.findMany({
        where: {
          isActive: true,
          priority,
        },
        orderBy: { createdAt: 'desc' },
      })

      return tips.map((tip) => ({
        id: tip.id,
        title: tip.title,
        description: tip.description,
        icon: tip.icon,
        priority: tip.priority,
        category: tip.category,
        isActive: tip.isActive,
      }))
    } catch (error) {
      console.error('Error getting tips by priority:', error)
      throw new Error('Failed to get tips by priority')
    }
  }

  /**
   * Get tips by category
   */
  async getTipsByCategory(category: string): Promise<SavingsTip[]> {
    try {
      const tips = await prisma.savingsTip.findMany({
        where: {
          isActive: true,
          category: { contains: category, mode: 'insensitive' },
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      })

      return tips.map((tip) => ({
        id: tip.id,
        title: tip.title,
        description: tip.description,
        icon: tip.icon,
        priority: tip.priority,
        category: tip.category,
        isActive: tip.isActive,
      }))
    } catch (error) {
      console.error('Error getting tips by category:', error)
      throw new Error('Failed to get tips by category')
    }
  }

  /**
   * Create new savings tip
   */
  async createTip(data: {
    title: string
    description: string
    icon: string
    priority: Priority
    category: string
  }): Promise<SavingsTip> {
    try {
      const tip = await prisma.savingsTip.create({
        data: {
          ...data,
          isActive: true,
        },
      })

      return {
        id: tip.id,
        title: tip.title,
        description: tip.description,
        icon: tip.icon,
        priority: tip.priority,
        category: tip.category,
        isActive: tip.isActive,
      }
    } catch (error) {
      console.error('Error creating tip:', error)
      throw new Error('Failed to create tip')
    }
  }

  /**
   * Update existing tip
   */
  async updateTip(
    tipId: string,
    data: Partial<{
      title: string
      description: string
      icon: string
      priority: Priority
      category: string
      isActive: boolean
    }>
  ): Promise<SavingsTip> {
    try {
      const tip = await prisma.savingsTip.update({
        where: { id: tipId },
        data,
      })

      return {
        id: tip.id,
        title: tip.title,
        description: tip.description,
        icon: tip.icon,
        priority: tip.priority,
        category: tip.category,
        isActive: tip.isActive,
      }
    } catch (error) {
      console.error('Error updating tip:', error)
      throw new Error('Failed to update tip')
    }
  }

  /**
   * Deactivate tip
   */
  async deactivateTip(tipId: string): Promise<void> {
    try {
      await prisma.savingsTip.update({
        where: { id: tipId },
        data: { isActive: false },
      })
    } catch (error) {
      console.error('Error deactivating tip:', error)
      throw new Error('Failed to deactivate tip')
    }
  }
}

export default new TipsService()
