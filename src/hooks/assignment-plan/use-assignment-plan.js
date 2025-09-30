'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { assignmentAPI } from '@/lib/api-client'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''
export function useAssignmentPlan({ autoRefreshMs = 0, initial = null } = {}) {
  const [plan, setPlan] = useState(initial)
  const [loading, setLoading] = useState(!initial)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await assignmentAPI.getPlan({ commit: false })
      setPlan(data?.data || data)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initial) refresh()
  }, [initial, refresh])

  useEffect(() => {
    if (!autoRefreshMs) return
    const t = setInterval(refresh, autoRefreshMs)
    return () => clearInterval(t)
  }, [autoRefreshMs, refresh])

  const assignedUnits = plan?.assigned_units || []
  const unassigned = plan?.unassigned || []

  const unassignItem = useCallback(
    async (item_id) => {
      if (!plan) return
      //const draft = structuredClone(plan)
      let pulled = null

      draft.assigned_units.forEach((u) => {
        u.customers?.forEach((c) => {
          c.orders?.forEach((o) => {
            const idx = o.items.findIndex((it) => it.item_id === item_id)
            if (idx >= 0) {
              pulled = o.items[idx]
              o.items.splice(idx, 1)
            }
          })
        })
        const sum = u.customers
          ?.flatMap((c) => c.orders || [])
          .flatMap((o) => o.items || [])
          .reduce((s, it) => s + (it.assigned_weight_kg || 0), 0)
        u.used_capacity_kg = Math.round((sum + Number.EPSILON) * 1000) / 1000
      })

      if (pulled) {
        draft.unassigned = [
          {
            item_id: pulled.item_id,
            description: pulled.description,
            weight_left: pulled.assigned_weight_kg,
            order_id: pulled.order_id,
            route_name: pulled.route_name,
            suburb_name: pulled.suburb_name,
            customer_name: pulled.customer_name,
          },
          ...(draft.unassigned || []),
        ]
      }

      setPlan(draft)
      try {
        await assignmentAPI.unassignItem({ item_id })
      } catch (e) {
        await refresh()
        throw e
      }
    },
    [plan, refresh]
  )

  const assignItem = useCallback(
    async ({ plan_unit_id, item }) => {
      console.log('plan_unit_id :assignItem>> ', plan_unit_id, item)

      if (!plan) return
      //  const draft = structuredClone(plan)
      console.log('draft :>> ', draft)

      draft.unassigned = (draft.unassigned || []).filter(
        (u) => u.item_id !== item.item_id
      )

      const unit = draft.assigned_units.find(
        (u) => u.plan_unit_id === plan_unit_id
      )
      if (!unit) return

      if (!unit.customers?.length) {
        unit.customers = [
          {
            customer_id: item.customer_id || null,
            customer_name: item.customer_name || 'Unknown Customer',
            suburb_name: item.suburb_name || '',
            route_name: item.route_name || 'Unknown Route',
            orders: [
              {
                order_id: item.order_id || `temp-${Date.now()}`,
                total_assigned_weight_kg: 0,
                items: [],
              },
            ],
          },
        ]
      }

      const firstOrder = unit.customers[0].orders[0]
      firstOrder.items.push({
        item_id: item.item_id,
        order_id: item.order_id,
        description: item.description,
        assigned_weight_kg: item.weight_left,
        assignment_id: `local-${Math.random().toString(36).slice(2)}`,
      })
      firstOrder.total_assigned_weight_kg += item.weight_left || 0

      const sum = unit.customers
        .flatMap((c) => c.orders || [])
        .flatMap((o) => o.items || [])
        .reduce((s, it) => s + (it.assigned_weight_kg || 0), 0)
      unit.used_capacity_kg = Math.round((sum + Number.EPSILON) * 1000) / 1000

      setPlan(draft)

      try {
        //const response = await fetch(url, 'POST', body)
        await assignmentAPI.assignItem({ plan_unit_id, item_id: item.item_id })
      } catch (e) {
        await refresh()
        throw e
      }
    },
    [plan, refresh]
  )

  const unassignAllFromUnit = useCallback(
    async (plan_unit_id) => {
      if (!plan) return
      //  const draft = structuredClone(plan)
      const unit = draft.assigned_units.find(
        (u) => u.plan_unit_id === plan_unit_id
      )
      if (unit) {
        const moved =
          unit.customers
            ?.flatMap((c) => c.orders || [])
            .flatMap((o) => o.items || []) || []
        draft.unassigned = [
          ...moved.map((it) => ({
            item_id: it.item_id,
            description: it.description,
            weight_left: it.assigned_weight_kg,
            order_id: it.order_id,
            route_name: it.route_name,
            suburb_name: it.suburb_name,
            customer_name: it.customer_name,
          })),
          ...(draft.unassigned || []),
        ]
        unit.customers = []
        unit.used_capacity_kg = 0
        setPlan(draft)
      }
      try {
        await assignmentAPI.unassignAllItems(plan_unit_id)
      } catch (e) {
        await refresh()
        throw e
      }
    },
    [plan, refresh]
  )

  return {
    plan,
    assignedUnits,
    unassigned,
    loading,
    error,
    refresh,
    assignItem,
    unassignItem,
    unassignAllFromUnit,
  }
}
