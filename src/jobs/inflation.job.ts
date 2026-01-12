import cron from 'node-cron'
import inflationService from '../services/inflation.service'
import logger from '../utils/logger'

/**
 * Inflation Data Update Job
 * Runs daily at 6:00 AM Turkey time (UTC+3)
 * Fetches latest inflation data from TÜİK and updates database
 */
export const inflationUpdateJob = cron.schedule(
  '0 6 * * *',
  async () => {
    logger.info('Starting inflation data update job...')

    try {
      // Fetch latest inflation data
      const inflationData = await inflationService.fetchTurkeyInflationData()

      if (inflationData) {
        // Calculate trend based on historical data
        const historicalData = await inflationService.getHistoricalData(2)
        let trend = 'stable'

        if (historicalData.length >= 2) {
          const previous = historicalData[1].currentRate
          const current = inflationData.currentRate

          if (current > previous + 1) {
            trend = 'up'
          } else if (current < previous - 1) {
            trend = 'down'
          }
        }

        // Predict next month's rate
        const predictions = await inflationService.predictNextMonths(1)
        const predictedRate = predictions.length > 0 ? predictions[0] : undefined

        // Store in database
        await inflationService.storeInflationData({
          date: new Date(),
          rate: inflationData.currentRate,
          predictedRate,
          trend,
          source: 'TÜİK',
          categoryRates: inflationData.categoryRates,
        })

        logger.info(
          `Inflation data updated successfully. Current rate: ${inflationData.currentRate}%, Predicted: ${predictedRate}%, Trend: ${trend}`
        )

        // TODO: Send push notifications to users if inflation spike > 5%
        if (historicalData.length >= 1) {
          const previous = historicalData[0].currentRate
          const change = inflationData.currentRate - previous

          if (Math.abs(change) >= 5) {
            logger.warn(
              `Significant inflation change detected: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`
            )
            // Future: Trigger push notification service
          }
        }
      } else {
        logger.warn('No inflation data retrieved from source')
      }
    } catch (error) {
      logger.error('Error in inflation update job:', error)
      // Don't throw - let cron continue running
    }
  },
  {
    timezone: 'Europe/Istanbul', // Turkey timezone (UTC+3)
  }
)

/**
 * Manual trigger function for testing
 */
export async function runInflationUpdateNow(): Promise<void> {
  logger.info('Manually triggering inflation update...')

  try {
    const inflationData = await inflationService.fetchTurkeyInflationData()

    if (inflationData) {
      // Try to predict, but don't fail if insufficient data
      let predictedRate = null
      try {
        const predictions = await inflationService.predictNextMonths(1)
        predictedRate = predictions.length > 0 ? predictions[0] : null
      } catch (predictionError) {
        logger.warn('Could not generate prediction (may need more historical data)')
      }

      await inflationService.storeInflationData({
        date: new Date(),
        rate: inflationData.currentRate,
        predictedRate: predictedRate || undefined,
        trend: inflationData.trend,
        source: 'TÜİK',
        categoryRates: inflationData.categoryRates,
      })

      logger.info('Manual inflation update completed successfully')
    }
  } catch (error) {
    logger.error('Error in manual inflation update:', error)
    throw error
  }
}
