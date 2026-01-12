import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface Location {
  lat: number
  lng: number
  address?: string
}

export interface Deal {
  id: string
  product: string
  store: string
  oldPrice: number
  newPrice: number
  discount: number
  location: Location
  distance?: number
  validUntil: Date
  imageUrl?: string
  category?: string
  isActive: boolean
}

export class DealsService {
  /**
   * Scrape deals from Turkish grocery stores
   * In production, this would integrate with store APIs or web scraping
   */
  async scrapeStoreDeals(stores: string[]): Promise<Deal[]> {
    try {
      // Note: This is a placeholder for actual web scraping or API integration
      // In production, you would implement:
      // 1. Web scraping with Puppeteer/Playwright for stores without APIs
      // 2. API integration for stores with public APIs
      // 3. Rate limiting and error handling
      // 4. Data validation and normalization

      console.log(`Scraping deals from stores: ${stores.join(', ')}`)

      // For now, return deals from database
      const deals = await prisma.deal.findMany({
        where: {
          store: { in: stores },
          isActive: true,
          validUntil: { gte: new Date() },
        },
        orderBy: { discount: 'desc' },
      })

      return deals.map((deal) => ({
        id: deal.id,
        product: deal.product,
        store: deal.store,
        oldPrice: deal.oldPrice,
        newPrice: deal.newPrice,
        discount: deal.discount,
        location: deal.location as unknown as Location,
        validUntil: deal.validUntil,
        imageUrl: deal.imageUrl || undefined,
        category: deal.category || undefined,
        isActive: deal.isActive,
      }))
    } catch (error) {
      console.error('Error scraping store deals:', error)
      throw new Error('Failed to scrape store deals')
    }
  }

  /**
   * Find deals near a specific location within a radius (km)
   */
  async findNearbyDeals(location: Location, radius: number = 5): Promise<Deal[]> {
    try {
      // Get all active deals
      const allDeals = await prisma.deal.findMany({
        where: {
          isActive: true,
          validUntil: { gte: new Date() },
        },
      })

      // Calculate distance and filter
      const dealsWithDistance = allDeals
        .map((deal) => {
          const dealLocation = deal.location as unknown as Location
          const distance = this.calculateDistance(
            location.lat,
            location.lng,
            dealLocation.lat,
            dealLocation.lng
          )

          return {
            id: deal.id,
            product: deal.product,
            store: deal.store,
            oldPrice: deal.oldPrice,
            newPrice: deal.newPrice,
            discount: deal.discount,
            location: dealLocation,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            validUntil: deal.validUntil,
            imageUrl: deal.imageUrl || undefined,
            category: deal.category || undefined,
            isActive: deal.isActive,
          }
        })
        .sort((a, b) => a.distance! - b.distance!) // Sort by distance

      // Filter by radius
      let nearbyDeals = dealsWithDistance.filter((deal) => deal.distance! <= radius)

      // If no deals found within radius, check if user is very far away (>100km)
      // In that case, return all deals sorted by distance (useful for testing/demo)
      if (nearbyDeals.length === 0 && dealsWithDistance.length > 0) {
        const closestDeal = dealsWithDistance[0]
        if (closestDeal.distance! > 100) {
          console.log(`📍 User is ${closestDeal.distance}km from nearest deal, returning all deals`)
          // Return all deals for demo/testing purposes when user is far away
          return dealsWithDistance.slice(0, 20) // Limit to 20 deals
        }
      }

      return nearbyDeals
    } catch (error) {
      console.error('Error finding nearby deals:', error)
      throw new Error('Failed to find nearby deals')
    }
  }

  /**
   * Get deals by category
   */
  async getDealsByCategory(category: string): Promise<Deal[]> {
    try {
      const deals = await prisma.deal.findMany({
        where: {
          category: { contains: category, mode: 'insensitive' },
          isActive: true,
          validUntil: { gte: new Date() },
        },
        orderBy: { discount: 'desc' },
      })

      return deals.map((deal) => ({
        id: deal.id,
        product: deal.product,
        store: deal.store,
        oldPrice: deal.oldPrice,
        newPrice: deal.newPrice,
        discount: deal.discount,
        location: deal.location as unknown as Location,
        validUntil: deal.validUntil,
        imageUrl: deal.imageUrl || undefined,
        category: deal.category || undefined,
        isActive: deal.isActive,
      }))
    } catch (error) {
      console.error('Error getting deals by category:', error)
      throw new Error('Failed to get deals by category')
    }
  }

  /**
   * Track a deal for a user
   */
  async trackDeal(userId: string, dealId: string): Promise<void> {
    try {
      // Check if deal exists and is active
      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
      })

      if (!deal || !deal.isActive || deal.validUntil < new Date()) {
        throw new Error('Deal not found or expired')
      }

      // Track the deal for the user
      await prisma.userDeal.upsert({
        where: {
          userId_dealId: {
            userId,
            dealId,
          },
        },
        update: {
          savedAt: new Date(),
        },
        create: {
          userId,
          dealId,
          used: false,
        },
      })
    } catch (error) {
      console.error('Error tracking deal:', error)
      throw new Error('Failed to track deal')
    }
  }

  /**
   * Get user's saved deals
   */
  async getUserSavedDeals(userId: string): Promise<Deal[]> {
    try {
      const userDeals = await prisma.userDeal.findMany({
        where: { userId },
        include: {
          deal: true,
        },
        orderBy: { savedAt: 'desc' },
      })

      return userDeals
        .filter((ud) => ud.deal.isActive && ud.deal.validUntil >= new Date())
        .map((ud) => ({
          id: ud.deal.id,
          product: ud.deal.product,
          store: ud.deal.store,
          oldPrice: ud.deal.oldPrice,
          newPrice: ud.deal.newPrice,
          discount: ud.deal.discount,
          location: ud.deal.location as unknown as Location,
          validUntil: ud.deal.validUntil,
          imageUrl: ud.deal.imageUrl || undefined,
          category: ud.deal.category || undefined,
          isActive: ud.deal.isActive,
        }))
    } catch (error) {
      console.error('Error getting user saved deals:', error)
      throw new Error('Failed to get saved deals')
    }
  }

  /**
   * Mark deal as used
   */
  async markDealAsUsed(userId: string, dealId: string): Promise<void> {
    try {
      await prisma.userDeal.update({
        where: {
          userId_dealId: {
            userId,
            dealId,
          },
        },
        data: {
          used: true,
        },
      })
    } catch (error) {
      console.error('Error marking deal as used:', error)
      throw new Error('Failed to mark deal as used')
    }
  }

  /**
   * Store new deals in database
   */
  async storeDeals(deals: Omit<Deal, 'id' | 'isActive'>[]): Promise<void> {
    try {
      await prisma.deal.createMany({
        data: deals.map((deal) => ({
          product: deal.product,
          store: deal.store,
          oldPrice: deal.oldPrice,
          newPrice: deal.newPrice,
          discount: deal.discount,
          location: deal.location as any,
          validUntil: deal.validUntil,
          imageUrl: deal.imageUrl,
          category: deal.category,
          isActive: true,
        })),
        skipDuplicates: true,
      })
    } catch (error) {
      console.error('Error storing deals:', error)
      throw new Error('Failed to store deals')
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180
  }
}

export default new DealsService()
