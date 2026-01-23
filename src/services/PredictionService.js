/**
 * PredictionService - Consumption forecasting and trend analysis
 * Calculates predictions based on historical readings data
 */

export class PredictionService {
  /**
   * Calculate average daily consumption from readings
   * @param {Array} readings - Array of reading objects with timestamp and value
   * @returns {number} Average daily consumption
   */
  static calculateAverageDailyConsumption(readings) {
    if (!readings || readings.length < 2) return 0

    // Sort by timestamp ascending
    const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

    const firstReading = sorted[0]
    const lastReading = sorted[sorted.length - 1]

    const totalConsumption = lastReading.value - firstReading.value
    const daysDiff = (new Date(lastReading.timestamp) - new Date(firstReading.timestamp)) / (1000 * 60 * 60 * 24)

    if (daysDiff <= 0) return 0

    return totalConsumption / daysDiff
  }

  /**
   * Project annual usage based on current consumption rate
   * @param {Array} readings - Array of reading objects
   * @returns {Object} Annual projection with breakdown
   */
  static projectAnnualUsage(readings) {
    const dailyAvg = this.calculateAverageDailyConsumption(readings)

    return {
      daily: dailyAvg,
      weekly: dailyAvg * 7,
      monthly: dailyAvg * 30.44, // Average days per month
      annual: dailyAvg * 365,
      confidence: this.calculateConfidence(readings)
    }
  }

  /**
   * Get consumption for each month in the readings period
   * @param {Array} readings - Array of reading objects
   * @returns {Array} Monthly consumption data
   */
  static getMonthlyAverages(readings) {
    if (!readings || readings.length < 2) return []

    const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    const monthlyData = new Map()

    // Group readings by month
    for (let i = 1; i < sorted.length; i++) {
      const prevReading = sorted[i - 1]
      const currReading = sorted[i]

      const prevDate = new Date(prevReading.timestamp)
      const currDate = new Date(currReading.timestamp)

      // Calculate consumption for this period
      const consumption = currReading.value - prevReading.value
      const days = (currDate - prevDate) / (1000 * 60 * 60 * 24)

      if (days <= 0) continue

      const dailyRate = consumption / days

      // Distribute consumption across months in this period
      let date = new Date(prevDate)
      while (date <= currDate) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { totalConsumption: 0, days: 0 })
        }

        // Calculate days in this month within the reading period
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const periodStart = prevDate > monthStart ? prevDate : monthStart
        const periodEnd = currDate < monthEnd ? currDate : monthEnd

        const daysInPeriod = Math.max(0, (periodEnd - periodStart) / (1000 * 60 * 60 * 24))

        if (daysInPeriod > 0) {
          const monthData = monthlyData.get(monthKey)
          monthData.totalConsumption += dailyRate * daysInPeriod
          monthData.days += daysInPeriod
        }

        // Move to next month
        date = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    }

    // Convert to array and calculate averages
    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

    return Array.from(monthlyData.entries())
      .map(([key, data]) => {
        const [year, month] = key.split('-')
        return {
          key,
          year: parseInt(year),
          month: parseInt(month),
          monthName: monthNames[parseInt(month) - 1],
          consumption: data.totalConsumption,
          dailyAverage: data.days > 0 ? data.totalConsumption / data.days : 0
        }
      })
      .sort((a, b) => a.key.localeCompare(b.key))
  }

  /**
   * Analyze consumption trend
   * @param {Array} readings - Array of reading objects
   * @returns {Object} Trend analysis with direction and percentage
   */
  static analyzeTrend(readings) {
    if (!readings || readings.length < 4) {
      return { direction: 'insufficient_data', percentage: 0, description: 'Nicht genügend Daten' }
    }

    const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

    // Split readings into two halves
    const midpoint = Math.floor(sorted.length / 2)
    const firstHalf = sorted.slice(0, midpoint)
    const secondHalf = sorted.slice(midpoint)

    // Calculate daily rates for each half
    const firstHalfRate = this.calculateAverageDailyConsumption(firstHalf)
    const secondHalfRate = this.calculateAverageDailyConsumption(secondHalf)

    if (firstHalfRate === 0) {
      return { direction: 'stable', percentage: 0, description: 'Stabil' }
    }

    const changePercentage = ((secondHalfRate - firstHalfRate) / firstHalfRate) * 100

    let direction, description
    if (changePercentage > 10) {
      direction = 'increasing'
      description = 'Steigend'
    } else if (changePercentage < -10) {
      direction = 'decreasing'
      description = 'Fallend'
    } else {
      direction = 'stable'
      description = 'Stabil'
    }

    return {
      direction,
      percentage: Math.abs(changePercentage),
      description,
      firstPeriodRate: firstHalfRate,
      secondPeriodRate: secondHalfRate
    }
  }

  /**
   * Project meter reading for a target date
   * @param {Array} readings - Array of reading objects
   * @param {Date|string} targetDate - The date to project to
   * @returns {Object} Projected reading with confidence
   */
  static projectReading(readings, targetDate) {
    if (!readings || readings.length < 2) {
      return { value: null, confidence: 'low', error: 'Mindestens 2 Ablesungen erforderlich' }
    }

    const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    const lastReading = sorted[sorted.length - 1]

    const dailyRate = this.calculateAverageDailyConsumption(readings)
    const target = new Date(targetDate)
    const lastDate = new Date(lastReading.timestamp)

    const daysDiff = (target - lastDate) / (1000 * 60 * 60 * 24)
    const projectedValue = lastReading.value + (dailyRate * daysDiff)

    return {
      value: Math.max(0, projectedValue),
      baseReading: lastReading.value,
      dailyRate,
      daysDiff: Math.round(daysDiff),
      confidence: this.calculateConfidence(readings),
      targetDate: target.toISOString()
    }
  }

  /**
   * Calculate confidence level based on data quality
   * @param {Array} readings - Array of reading objects
   * @returns {string} Confidence level: 'high', 'medium', or 'low'
   */
  static calculateConfidence(readings) {
    if (!readings || readings.length < 2) return 'low'

    // More readings = higher confidence
    if (readings.length >= 12) return 'high'
    if (readings.length >= 6) return 'medium'
    return 'low'
  }

  /**
   * Get confidence description in German
   * @param {string} confidence - Confidence level
   * @returns {string} German description
   */
  static getConfidenceDescription(confidence) {
    const descriptions = {
      high: 'Hohe Zuverlässigkeit (12+ Ablesungen)',
      medium: 'Mittlere Zuverlässigkeit (6-11 Ablesungen)',
      low: 'Niedrige Zuverlässigkeit (weniger als 6 Ablesungen)'
    }
    return descriptions[confidence] || descriptions.low
  }

  /**
   * Get year-end projection
   * @param {Array} readings - Array of reading objects
   * @returns {Object} End of year projection
   */
  static getYearEndProjection(readings) {
    const now = new Date()
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59)

    return this.projectReading(readings, yearEnd)
  }

  /**
   * Calculate consumption comparison with previous period
   * @param {Array} readings - Array of reading objects
   * @param {number} periodDays - Number of days for the period (default: 30)
   * @returns {Object} Comparison data
   */
  static comparePeriods(readings, periodDays = 30) {
    if (!readings || readings.length < 3) {
      return {
        current: 0,
        previous: 0,
        change: 0,
        changePercent: 0,
        error: 'Nicht genügend Daten für Vergleich'
      }
    }

    const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    const now = new Date()
    const periodStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000))
    const previousPeriodStart = new Date(periodStart.getTime() - (periodDays * 24 * 60 * 60 * 1000))

    // Filter readings for current and previous periods
    const currentPeriodReadings = sorted.filter(r => {
      const date = new Date(r.timestamp)
      return date >= periodStart && date <= now
    })

    const previousPeriodReadings = sorted.filter(r => {
      const date = new Date(r.timestamp)
      return date >= previousPeriodStart && date < periodStart
    })

    // Calculate consumption for each period
    const currentConsumption = this.calculatePeriodConsumption(currentPeriodReadings)
    const previousConsumption = this.calculatePeriodConsumption(previousPeriodReadings)

    const change = currentConsumption - previousConsumption
    const changePercent = previousConsumption > 0
      ? ((change / previousConsumption) * 100)
      : 0

    return {
      current: currentConsumption,
      previous: previousConsumption,
      change,
      changePercent,
      periodDays
    }
  }

  /**
   * Calculate consumption within a period's readings
   * @param {Array} readings - Filtered readings for the period
   * @returns {number} Total consumption
   */
  static calculatePeriodConsumption(readings) {
    if (!readings || readings.length < 2) return 0

    const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    return sorted[sorted.length - 1].value - sorted[0].value
  }
}

export default PredictionService
