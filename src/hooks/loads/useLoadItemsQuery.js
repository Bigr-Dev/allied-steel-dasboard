'use client'

import { useState, useEffect, useCallback } from 'react'
import { getLoadItems } from '@/lib/api/loads'
import { mapErrorToMessage } from '@/lib/errorMap'

/**
 * Hook for fetching and managing load items data
 * @param {Object} initialParams - Initial query parameters
 * @returns {Object} Load items query state and methods
 */
export function useLoadItemsQuery(initialParams = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [params, setParams] = useState(initialParams)

  const fetchLoadItems = useCallback(
    async (newParams = {}) => {
      setLoading(true)
      setError(null)

      try {
        const queryParams = { ...params, ...newParams }
        const result = await getLoadItems(queryParams)

        setData(result)
        setParams(queryParams)
      } catch (err) {
        const errorMessage = mapErrorToMessage(err)
        setError(errorMessage)
        console.error('Error fetching load items:', err)
      } finally {
        setLoading(false)
      }
    },
    [params]
  )

  const refetch = useCallback(() => {
    return fetchLoadItems()
  }, [fetchLoadItems])

  const updateParams = useCallback((newParams) => {
    setParams((prev) => ({ ...prev, ...newParams }))
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setParams(initialParams)
  }, [initialParams])

  // Auto-fetch when params change
  useEffect(() => {
    if (Object.keys(params).length > 0) {
      fetchLoadItems()
    }
  }, [params, fetchLoadItems])

  return {
    data,
    loading,
    error,
    params,
    fetchLoadItems,
    refetch,
    updateParams,
    reset,
    // Computed values
    items: data?.items || [],
    count: data?.count || 0,
    hasData: data?.items?.length > 0,
    isEmpty: data?.items?.length === 0 && !loading,
  }
}
