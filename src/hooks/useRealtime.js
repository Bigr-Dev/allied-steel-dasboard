// hooks/useRealtime.js
'use client'

import { useEffect, useRef } from 'react'
import { subscribeToTable } from '@/lib/realtime'

/**
 * React hook to subscribe to a single table.
 * Automatically unsubscribes on unmount or when deps change.
 *
 * @param {Object} options - same as subscribeToTable
 */
export default function useRealtime(options) {
  const unsubRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    async function run() {
      // Clean any existing sub first (hot reloads / option changes)
      if (unsubRef.current) {
        await unsubRef.current()
        unsubRef.current = null
      }

      const { unsubscribe } = await subscribeToTable(options)
      if (!isMounted) {
        // unmounted before subscribe resolved:
        await unsubscribe()
        return
      }
      unsubRef.current = unsubscribe
    }

    run()

    return () => {
      isMounted = false
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
    }
    // Re-subscribe when these change:
  }, [
    options?.schema,
    options?.table,
    // stringify events + filter to keep dependencies simple
    JSON.stringify(options?.events || '*'),
    options?.filter || '',
  ])
}
