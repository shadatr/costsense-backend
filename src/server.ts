import app from './app'
import { env } from '@/config/env'
import { prisma } from '@/config/database'
import logger from '@/utils/logger'
import { inflationUpdateJob, runInflationUpdateNow } from '@/jobs/inflation.job'
import { dealsUpdateJob, dealsCleanupJob, runDealsUpdateNow } from '@/jobs/deals.job'

const PORT = env.PORT || 8000

/**
 * Start the server
 */
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`)
  logger.info(`📝 Environment: ${env.NODE_ENV}`)
  logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/v1`)
  logger.info(`💚 Health Check: http://localhost:${PORT}/api/v1/health`)

  // Start cron jobs
  startCronJobs()
})

/**
 * Initialize and start cron jobs
 */
function startCronJobs() {
  logger.info('📅 Starting cron jobs...')

  // Start inflation update job (daily at 6 AM Turkey time)
  inflationUpdateJob.start()
  logger.info('✅ Inflation update job scheduled (daily at 6:00 AM Turkey time)')

  // Start deals update job (every Monday at 8 AM Turkey time)
  dealsUpdateJob.start()
  logger.info('✅ Deals scraping job scheduled (every Monday at 8:00 AM Turkey time)')

  // Start deals cleanup job (daily at 2 AM Turkey time)
  dealsCleanupJob.start()
  logger.info('✅ Deals cleanup job scheduled (daily at 2:00 AM Turkey time)')

  logger.info('📅 All cron jobs started successfully')

  // Run initial updates in development mode (optional)
  if (env.NODE_ENV === 'development') {
    logger.info('🔧 Development mode: Running initial data updates...')

    // Run after 5 seconds to allow server to fully start
    setTimeout(async () => {
      try {
        logger.info('Running initial inflation update...')
        await runInflationUpdateNow()

        logger.info('Running initial deals update...')
        await runDealsUpdateNow()

        logger.info('✅ Initial data updates completed')
      } catch (error) {
        logger.error('Error during initial data updates:', error)
      }
    }, 5000)
  }
}

/**
 * Stop all cron jobs
 */
function stopCronJobs() {
  logger.info('📅 Stopping cron jobs...')

  inflationUpdateJob.stop()
  dealsUpdateJob.stop()
  dealsCleanupJob.stop()

  logger.info('✅ All cron jobs stopped')
}

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`)

  // Stop cron jobs first
  stopCronJobs()

  server.close(async () => {
    logger.info('HTTP server closed')

    // Disconnect from database
    await prisma.$disconnect()
    logger.info('Database connection closed')

    process.exit(0)
  })

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err)
  gracefulShutdown('UNHANDLED_REJECTION')
})

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err)
  gracefulShutdown('UNCAUGHT_EXCEPTION')
})

export default server
