import app from './app'
import { env } from '@/config/env'
import { prisma } from '@/config/database'
import logger from '@/utils/logger'

const PORT = env.PORT || 8000

/**
 * Start the server
 */
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`)
  logger.info(`📝 Environment: ${env.NODE_ENV}`)
  logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/v1`)
  logger.info(`💚 Health Check: http://localhost:${PORT}/api/v1/health`)
})

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`)

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
