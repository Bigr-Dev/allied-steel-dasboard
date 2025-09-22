'use client'

import { useState, useEffect, useCallback } from 'react'
import { getLoads } from '@/lib/api/loads'
import { mapErrorToMessage } from '@/lib/errorMap'

/**
 * Hook for fetching and managing loads data
 * @param {Object} initialParams - Initial query parameters
 * @returns {Object} Loads query state and methods
 */
export function useLoadsQuery(initialParams = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [params, setParams] = useState(initialParams)

  const fetchLoads = useCallback(
    async (newParams = {}) => {
      setLoading(true)
      setError(null)

      try {
        const queryParams = { ...params, ...newParams }
        const result = await getLoads(queryParams)
        // console.log('result :>> ', result)
        // console.log('queryParams :>> ', queryParams)
        setData(result)
        // setParams(queryParams)
      } catch (err) {
        const errorMessage = mapErrorToMessage(err)
        setError(errorMessage)
        console.error('Error fetching loads:', err)
      } finally {
        setLoading(false)
      }
    },
    [params]
  )

  const refetch = useCallback(() => {
    return fetchLoads()
  }, [fetchLoads])

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
      fetchLoads()
    }
  }, [params, fetchLoads])

  return {
    data,
    loading,
    error,
    params,
    fetchLoads,
    refetch,
    updateParams,
    reset,
    // Computed values
    results: data || [],
    count: data?.count || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,
    hasData: data?.length > 0,
    isEmpty: data?.results?.length === 0 && !loading,
  }
}
