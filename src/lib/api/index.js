// Base client
export { apiRequest, APIError } from './base-client'

// Domain APIs
export * as planningAPI from './planning-api'
export * as assignmentAPI from './assignment-api'
export * as branchesAPI from './branches-api'
export * as customersAPI from './customers-api'
export * as driversAPI from './drivers-api'
export * as vehiclesAPI from './vehicles-api'
export * as loadsAPI from './loads-api'
export * as usersAPI from './users-api'

// Error handling utility
export function handleAPIError(error, toast) {
  console.error('API Error:', error)

  let title = 'Error'
  let description = 'An unexpected error occurred'

  if (error?.name === 'APIError') {
    switch (error.status) {
      case 400:
        title = 'Invalid Request'
        description = error.message || 'Please check your input and try again'
        break
      case 401:
        title = 'Unauthorized'
        description = 'Please log in to continue'
        break
      case 403:
        title = 'Access Denied'
        description = 'You do not have permission to perform this action'
        break
      case 404:
        title = 'Not Found'
        description = 'The requested resource was not found'
        break
      case 500:
        title = 'Server Error'
        description = 'Something went wrong on our end. Please try again later.'
        break
      default:
        description = error.message || description
    }
  }

  toast({
    title,
    description,
    variant: 'destructive',
  })
}