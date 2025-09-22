/**
 * Map HTTP status codes to user-friendly error messages
 * @param {number} status - HTTP status code
 * @param {string} [defaultMessage] - Default message if no mapping found
 * @returns {string} User-friendly error message
 */
export function mapHttpStatusToMessage(
  status,
  defaultMessage = 'An unexpected error occurred'
) {
  const statusMessages = {
    // Client errors
    400: 'Invalid request. Please check your input and try again.',
    401: 'You are not authorized to perform this action. Please log in again.',
    403: 'You do not have permission to access this resource.',
    404: 'The requested resource was not found.',
    405: 'This action is not allowed.',
    408: 'The request timed out. Please try again.',
    409: 'This action conflicts with existing data. Please check and try again.',
    422: 'The data you provided is invalid. Please check your input.',
    429: 'Too many requests. Please wait a moment and try again.',

    // Server errors
    500: 'Internal server error. Please try again later.',
    502: 'Service temporarily unavailable. Please try again later.',
    503: 'Service is currently unavailable. Please try again later.',
    504: 'Request timeout. The server is taking too long to respond.',
  }

  return statusMessages[status] || defaultMessage
}

/**
 * Map specific error types to user-friendly messages
 * @param {Error|string} error - Error object or message
 * @returns {string} User-friendly error message
 */
export function mapErrorToMessage(error) {
  if (typeof error === 'string') {
    return error
  }

  if (!error) {
    return 'An unexpected error occurred'
  }

  // Handle network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }

  // Handle timeout errors
  if (error.name === 'AbortError') {
    return 'Request timed out. Please try again.'
  }

  // Handle validation errors
  if (
    error.message?.includes('validation') ||
    error.message?.includes('required')
  ) {
    return 'Please check your input and ensure all required fields are filled.'
  }

  // Handle authentication errors
  if (
    error.message?.includes('unauthorized') ||
    error.message?.includes('401')
  ) {
    return 'Your session has expired. Please log in again.'
  }

  // Handle permission errors
  if (error.message?.includes('forbidden') || error.message?.includes('403')) {
    return 'You do not have permission to perform this action.'
  }

  // Handle not found errors
  if (error.message?.includes('not found') || error.message?.includes('404')) {
    return 'The requested resource was not found.'
  }

  // Handle conflict errors
  if (error.message?.includes('conflict') || error.message?.includes('409')) {
    return 'This action conflicts with existing data. Please check and try again.'
  }

  // Handle duplicate errors
  if (
    error.message?.includes('duplicate') ||
    error.message?.includes('UNIQUE')
  ) {
    return 'This item already exists. Please use a different value.'
  }

  // Return the original message if it's user-friendly, otherwise return a generic message
  if (
    error.message &&
    error.message.length < 100 &&
    !error.message.includes('Error:')
  ) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Extract error message from API response
 * @param {Object} response - API response object
 * @returns {string} Extracted error message
 */
export function extractErrorMessage(response) {
  if (!response) {
    return 'No response received from server'
  }

  // Check for error in response.data
  if (response.data?.error) {
    return response.data.error
  }

  // Check for error in response.data.message
  if (response.data?.message) {
    return response.data.message
  }

  // Check for error in response.message
  if (response.message) {
    return response.message
  }

  // Check for error in response.error
  if (response.error) {
    return response.error
  }

  // Check for error in response.statusText
  if (response.statusText) {
    return response.statusText
  }

  return 'An unexpected error occurred'
}

/**
 * Create a standardized error object
 * @param {string|Error} error - Error message or Error object
 * @param {number} [status] - HTTP status code
 * @returns {Object} Standardized error object
 */
export function createStandardError(error, status = null) {
  const message =
    typeof error === 'string'
      ? error
      : error?.message || 'An unexpected error occurred'

  return {
    message: mapErrorToMessage(message),
    status: status || error?.status || null,
    timestamp: new Date().toISOString(),
    originalError: error,
  }
}
