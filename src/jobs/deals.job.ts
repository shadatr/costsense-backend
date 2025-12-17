import cron from 'node-cron'
import dealsService from '../services/deals.service'
import logger from '../utils/logger'

/**
 * Deals Scraping Job
 * Runs every Monday at 8:00 AM Turkey time (UTC+3)
 * Scrapes deals from major Turkish grocery stores
 */
export const dealsUpdateJob = cron.schedule(
  '0 8 * * 1',
  async () => {
    logger.info('Starting deals scraping job...')

    const stores = ['Migros', 'BİM', 'Şok', 'A101']

    try {
      // Scrape deals from all stores
      const allDeals = await dealsService.scrapeStoreDeals(stores)

      logger.info(`Successfully scraped ${allDeals.length} deals from ${stores.length} stores`)

      // Store deals in database
      if (allDeals.length > 0) {
        await dealsService.storeDeals(
          allDeals.map((deal) => ({
            product: deal.product,
            store: deal.store,
            oldPrice: deal.oldPrice,
            newPrice: deal.newPrice,
            discount: deal.discount,
            location: deal.location,
            validUntil: deal.validUntil,
            imageUrl: deal.imageUrl,
            category: deal.category,
          }))
        )

        logger.info('Deals stored successfully in database')

        // Log summary by store
        const dealsByStore = allDeals.reduce(
          (acc, deal) => {
            acc[deal.store] = (acc[deal.store] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )

        logger.info('Deals by store:', dealsByStore)
      } else {
        logger.warn('No deals found during scraping')
      }
    } catch (error) {
      logger.error('Error in deals scraping job:', error)
      // Don't throw - let cron continue running
    }
  },
  {
    scheduled: false, // Don't start automatically, will be started in server.ts
    timezone: 'Europe/Istanbul', // Turkey timezone (UTC+3)
  }
)

/**
 * Manual trigger function for testing
 * Optionally specify which stores to scrape
 */
export async function runDealsUpdateNow(storesToScrape?: string[]): Promise<void> {
  logger.info('Manually triggering deals scraping...')

  const stores = storesToScrape || ['Migros', 'BİM', 'Şok', 'A101']

  try {
    const allDeals = await dealsService.scrapeStoreDeals(stores)

    logger.info(`Scraped ${allDeals.length} deals from ${stores.length} stores`)

    if (allDeals.length > 0) {
      await dealsService.storeDeals(
        allDeals.map((deal) => ({
          product: deal.product,
          store: deal.store,
          oldPrice: deal.oldPrice,
          newPrice: deal.newPrice,
          discount: deal.discount,
          location: deal.location,
          validUntil: deal.validUntil,
          imageUrl: deal.imageUrl,
          category: deal.category,
        }))
      )

      logger.info('Manual deals update completed successfully')
    } else {
      logger.warn('No deals found')
    }
  } catch (error) {
    logger.error('Error in manual deals update:', error)
    throw error
  }
}

/**
 * Cleanup Job - Remove expired deals
 * Runs daily at 2:00 AM Turkey time (UTC+3)
 */
export const dealsCleanupJob = cron.schedule(
  '0 2 * * *',
  async () => {
    logger.info('Starting deals cleanup job...')

    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      // Delete deals that have expired
      const result = await prisma.deal.deleteMany({
        where: {
          validUntil: {
            lt: new Date(),
          },
        },
      })

      logger.info(`Cleaned up ${result.count} expired deals`)

      await prisma.$disconnect()
    } catch (error) {
      logger.error('Error in deals cleanup job:', error)
    }
  },
  {
    scheduled: false,
    timezone: 'Europe/Istanbul',
  }
)
