'use client'

import { useState, useCallback } from 'react'
import { reassignOrder } from '@/lib/api/loads'
import { mapErrorToMessage } from '@/lib/errorMap'
import { toast } from '@/hooks/use-toast'

/**
 * Hook for reassigning orders to different load stops
 * @returns {Object} Reassign order state and methods
 */
export function useReassignOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const reassign = useCallback(async (orderId, body) => {
    setLoading(true)
    setError(null)

    try {
      const result = await reassignOrder(orderId, body)

      toast({
        title: 'Order reassigned successfully',
        description: 'The order has been moved to the new load stop.',
      })

      return result
    } catch (err) {
      const errorMessage = mapErrorToMessage(err)
      setError(errorMessage)

      toast({
        title: 'Failed to reassign order',
        description: errorMessage,
        variant: 'destructive',
      })

      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    reassign,
    clearError,
  }
}
