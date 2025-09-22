/**
 * Format weight in kilograms to a readable string
 * @param {number} weight - Weight in kg
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {string} Formatted weight string
 */
export function formatWeight(weight, decimals = 1) {
  if (weight === null || weight === undefined || isNaN(weight)) {
    return '0 kg'
  }

  return `${Number(weight).toFixed(decimals)} kg`
}

/**
 * Format quantity to a readable string
 * @param {number} quantity - Quantity value
 * @param {string} [unit=''] - Unit of measurement
 * @returns {string} Formatted quantity string
 */
export function formatQty(quantity, unit = '') {
  if (quantity === null || quantity === undefined || isNaN(quantity)) {
    return `0${unit ? ` ${unit}` : ''}`
  }

  const formatted = Number(quantity).toLocaleString()
  return unit ? `${formatted} ${unit}` : formatted
}

/**
 * Format date from YYYY-MM-DD format to a readable string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {Object} [options] - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) {
    return 'N/A'
  }

  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Africa/Johannesburg',
      ...options,
    }

    return date.toLocaleDateString('en-ZA', defaultOptions)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} Date in YYYY-MM-DD format
 */
export function formatDateForInput(date) {
  if (!date) {
    return ''
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return ''
    }

    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('Error formatting date for input:', error)
    return ''
  }
}

/**
 * Format length in millimeters to a readable string
 * @param {number} length - Length in mm
 * @param {number} [decimals=0] - Number of decimal places
 * @returns {string} Formatted length string
 */
export function formatLength(length, decimals = 0) {
  if (length === null || length === undefined || isNaN(length)) {
    return '0 mm'
  }

  return `${Number(length).toFixed(decimals)} mm`
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} [currency='ZAR'] - Currency code
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'ZAR') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `R 0.00`
  }

  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  } catch (error) {
    console.error('Error formatting currency:', error)
    return `R ${Number(amount).toFixed(2)}`
  }
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} [maxLength=50] - Maximum length
 * @returns {string} Truncated text with ellipsis
 */
export function truncateText(text, maxLength = 50) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  if (text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength) + '...'
}
