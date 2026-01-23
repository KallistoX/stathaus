import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

/**
 * ReportService - PDF report generation for meter readings
 */
export class ReportService {
  /**
   * Generate a PDF report
   * @param {Object} config - Report configuration
   * @param {Object} dataStore - Data store instance
   * @returns {jsPDF} PDF document
   */
  static async generatePDF(config, dataStore) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(config.title || 'Zählerstand-Bericht', pageWidth / 2, 20, { align: 'center' })

    // Date range
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const dateRangeText = this.formatDateRange(config.dateRange)
    doc.text(dateRangeText, pageWidth / 2, 28, { align: 'center' })

    // Generated date
    doc.setFontSize(8)
    doc.setTextColor(128)
    doc.text(`Erstellt am ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, 34, { align: 'center' })
    doc.setTextColor(0)

    let yPosition = 45

    // Get meters to include
    const meters = this.getMetersForReport(config, dataStore)

    // Summary section
    if (meters.length > 0) {
      yPosition = this.addSummarySection(doc, meters, dataStore, config, yPosition)
    }

    // Meter details
    for (const meter of meters) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      yPosition = this.addMeterSection(doc, meter, dataStore, config, yPosition)
    }

    return doc
  }

  /**
   * Add summary section to the PDF
   */
  static addSummarySection(doc, meters, dataStore, config, yPosition) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Zusammenfassung', 14, yPosition)
    yPosition += 8

    // Summary table data
    const summaryData = meters.map(meter => {
      const readings = dataStore.getReadingsForMeter(meter.id)
      const filteredReadings = this.filterReadingsByDate(readings, config.dateRange)
      const latestReading = filteredReadings.length > 0 ? filteredReadings[filteredReadings.length - 1] : null
      const firstReading = filteredReadings.length > 0 ? filteredReadings[0] : null

      let consumption = 0
      if (firstReading && latestReading) {
        consumption = latestReading.value - firstReading.value
      }

      let cost = 0
      if (config.includeCosts && meter.tariffId) {
        cost = dataStore.calculateCost(meter.id, config.dateRange?.start, config.dateRange?.end)
      }

      return [
        `${meter.type?.icon || '📊'} ${meter.name}`,
        meter.type?.name || '-',
        latestReading ? this.formatNumber(latestReading.value) : '-',
        this.formatNumber(consumption),
        meter.type?.unit || '',
        config.includeCosts ? this.formatCurrency(cost, dataStore.data?.settings?.currency || 'EUR') : '-'
      ]
    })

    const headers = ['Zähler', 'Typ', 'Aktuell', 'Verbrauch', 'Einheit']
    if (config.includeCosts) {
      headers.push('Kosten')
    }

    doc.autoTable({
      startY: yPosition,
      head: [headers],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 50 },
        3: { halign: 'right' },
        5: { halign: 'right' }
      }
    })

    return doc.lastAutoTable.finalY + 15
  }

  /**
   * Add meter section with readings table
   */
  static addMeterSection(doc, meter, dataStore, config, yPosition) {
    const readings = dataStore.getReadingsForMeter(meter.id)
    const filteredReadings = this.filterReadingsByDate(readings, config.dateRange)

    if (filteredReadings.length === 0) return yPosition

    // Meter header
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`${meter.type?.icon || '📊'} ${meter.name}`, 14, yPosition)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(128)
    const meterInfo = [meter.type?.name, meter.location].filter(Boolean).join(' - ')
    if (meterInfo) {
      doc.text(meterInfo, 14, yPosition + 5)
    }
    doc.setTextColor(0)

    yPosition += meterInfo ? 12 : 8

    // Readings table
    const readingsData = filteredReadings.map((reading, index) => {
      const prevReading = index > 0 ? filteredReadings[index - 1] : null
      const consumption = prevReading ? reading.value - prevReading.value : '-'

      return [
        new Date(reading.timestamp).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        this.formatNumber(reading.value),
        typeof consumption === 'number' ? this.formatNumber(consumption) : consumption,
        reading.note || ''
      ]
    })

    doc.autoTable({
      startY: yPosition,
      head: [['Datum', `Stand (${meter.type?.unit || ''})`, 'Verbrauch', 'Notiz']],
      body: readingsData,
      theme: 'grid',
      headStyles: { fillColor: [107, 114, 128] },
      styles: { fontSize: 8 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' }
      }
    })

    return doc.lastAutoTable.finalY + 15
  }

  /**
   * Get meters to include in the report
   */
  static getMetersForReport(config, dataStore) {
    const allMeters = dataStore.metersWithTypes

    if (config.meters === 'all' || !config.meters) {
      return allMeters
    }

    return allMeters.filter(m => config.meters.includes(m.id))
  }

  /**
   * Filter readings by date range
   */
  static filterReadingsByDate(readings, dateRange) {
    if (!dateRange) return readings

    return readings.filter(reading => {
      const date = new Date(reading.timestamp)
      if (dateRange.start && date < new Date(dateRange.start)) return false
      if (dateRange.end && date > new Date(dateRange.end)) return false
      return true
    })
  }

  /**
   * Format date range for display
   */
  static formatDateRange(dateRange) {
    if (!dateRange || (!dateRange.start && !dateRange.end)) {
      return 'Alle Daten'
    }

    const formatDate = (date) => new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

    if (dateRange.start && dateRange.end) {
      return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
    } else if (dateRange.start) {
      return `Ab ${formatDate(dateRange.start)}`
    } else {
      return `Bis ${formatDate(dateRange.end)}`
    }
  }

  /**
   * Format number for display
   */
  static formatNumber(value) {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value)
  }

  /**
   * Format currency for display
   */
  static formatCurrency(value, currency = 'EUR') {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  /**
   * Download the PDF
   */
  static downloadPDF(doc, filename = 'zaehlerstand-bericht.pdf') {
    doc.save(filename)
  }
}

export default ReportService
