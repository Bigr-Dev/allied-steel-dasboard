'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { useGlobalContext } from '@/context/global-context'
import { useToast } from '@/hooks/use-toast'
import { handleAPIError } from '@/lib/api-client'
import DetailActionBar from '../layout/detail-action-bar'

// ───────────────────────────── helpers ─────────────────────────────

const fmtNumber = (val) => {
  if (val == null || Number.isNaN(Number(val))) return '0'
  return Number(val).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const LoadAssignmentSingle = ({ id, data }) => {
  const router = useRouter()
  const { toast } = useToast()
  const { setAssignmentPreview, fetchData } = useGlobalContext()

  const [plan, setPlan] = useState(data?.plan || null)
  const [units, setUnits] = useState(data?.units || [])
  const [unassignedOrders, setUnassignedOrders] = useState(
    data?.unassigned_orders || []
  )

  const [assigning, setAssigning] = useState(false)
  const [unassigning, setUnassigning] = useState(false)

  // Whenever the server sends us a fresh payload, sync local state
  useEffect(() => {
    setPlan(data?.plan || null)
    setUnits(data?.units || [])
    setUnassignedOrders(data?.unassigned_orders || [])
  }, [data])

  // Keep global preview aligned with this page
  useEffect(() => {
    if (!setAssignmentPreview) return
    setAssignmentPreview({
      plan,
      units,
      unassigned_orders: unassignedOrders,
    })
  }, [plan, units, unassignedOrders, setAssignmentPreview])

  // Current unit (planned_unit_id === id)
  const unit = useMemo(
    () => (units || []).find((u) => String(u.planned_unit_id) === String(id)),
    [units, id]
  )

  const assignedOrders = unit?.orders || []

  // Capacity / utilisation
  const { capacityKg, usedKg, usedPct, isOverCap, isNearCap } = useMemo(() => {
    if (!unit) {
      return {
        capacityKg: 0,
        usedKg: 0,
        usedPct: 0,
        isOverCap: false,
        isNearCap: false,
      }
    }

    const rawCapacity =
      unit.vehicle_type === 'horse'
        ? unit?.trailer?.capacity
        : unit?.vehicle?.capacity

    const cap = Number(rawCapacity || 0) || 0
    const used = Number(unit?.summary?.total_weight || 0) || 0
    const pct = cap > 0 ? (used / cap) * 100 : 0

    return {
      capacityKg: cap,
      usedKg: used,
      usedPct: pct,
      isOverCap: pct > 100,
      isNearCap: pct >= 85 && pct <= 100,
    }
  }, [unit])

  // ───────────────────────────── API helpers ─────────────────────────────

  const applyServerPayload = (res) => {
    const payload = res?.data || res?.payload || null
    if (!payload) return

    setPlan(payload.plan || null)
    setUnits(payload.units || [])
    setUnassignedOrders(payload.unassigned_orders || [])

    if (setAssignmentPreview) {
      setAssignmentPreview(payload)
    }
  }

  const assignOrder = async (orderId) => {
    if (!plan || !unit || !orderId) return
    setAssigning(true)
    try {
      const res = await fetchData(`plans/${plan.id}/bulk-assign`, 'POST', {
        plan_id: plan.id,
        assignments: [
          {
            planned_unit_id: unit.planned_unit_id,
            order_ids: [orderId],
          },
        ],
      })

      if (res?.success === false) {
        toast({
          title: 'Assign failed',
          description: res?.message || 'Could not assign order',
          variant: 'destructive',
        })
      } else {
        applyServerPayload(res)
        toast({
          title: 'Order assigned',
          description: 'The order was assigned to this unit.',
        })
      }
    } catch (err) {
      handleAPIError(err, toast)
    } finally {
      setAssigning(false)
    }
  }

  const unassignOrder = async (orderId) => {
    if (!plan || !orderId) return
    setUnassigning(true)
    try {
      const res = await fetchData(`plans/${plan.id}/unassign`, 'POST', {
        plan_id: plan.id,
        order_ids: [orderId],
      })

      if (res?.success === false) {
        toast({
          title: 'Unassign failed',
          description: res?.message || 'Could not unassign order',
          variant: 'destructive',
        })
      } else {
        applyServerPayload(res)
        toast({
          title: 'Order unassigned',
          description: 'The order was removed from this unit.',
        })
      }
    } catch (err) {
      handleAPIError(err, toast)
    } finally {
      setUnassigning(false)
    }
  }

  // ───────────────────────────── render helpers ─────────────────────────────

  if (!plan || !unit) {
    return (
      <div className="p-6">
        <button
          className="mb-4 inline-flex items-center gap-2 text-sm text-sky-600 hover:text-sky-800"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Plan or unit not found.
        </div>
      </div>
    )
  }

  const vehicle = unit.vehicle || {}
  const trailer = unit.trailer || null
  const driver = unit.driver || null

  const plate = vehicle.plate || vehicle.license_plate || 'Unit'
  const reg = vehicle.reg_number || vehicle.fleet_number || ''
  const driverName =
    driver?.name || driver?.last_name
      ? `${driver?.name || ''} ${driver?.last_name || ''}`.trim()
      : driver?.drivername || 'No driver assigned'

  const customersOnUnit = new Set(
    assignedOrders.map((o) => o.customer_name || o.customer_id)
  )

  // ───────────────────────────── JSX pieces ─────────────────────────────

  const AssignedOrdersList = () => {
    if (!assignedOrders.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          No orders assigned to this unit.
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {assignedOrders.map((o) => (
          <div
            key={o.order_id}
            className="flex items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3 text-sm shadow-sm"
          >
            <div>
              <div className="font-medium text-slate-800">
                {o.customer_name || 'Unknown customer'}
              </div>
              <div className="text-xs text-slate-500">
                {o.sales_order_number} · {o.route_name || o.suburb_name || ''}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {fmtNumber(o.total_weight)}kg · {o.total_line_items || 0} lines
              </div>
            </div>
            <button
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => unassignOrder(o.order_id)}
              disabled={unassigning}
            >
              {unassigning ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Updating…
                </>
              ) : (
                'Unassign'
              )}
            </button>
          </div>
        ))}
      </div>
    )
  }

  const UnassignedOrdersList = () => {
    if (!unassignedOrders.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          No unassigned orders in this plan.
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {unassignedOrders.map((o) => (
          <div
            key={o.order_id}
            className="flex items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3 text-sm shadow-sm"
          >
            <div>
              <div className="font-medium text-slate-800">
                {o.customer_name || 'Unknown customer'}
              </div>
              <div className="text-xs text-slate-500">
                {o.sales_order_number} · {o.route_name || o.suburb_name || ''}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {fmtNumber(o.total_weight)}kg · {o.total_line_items || 0} lines
              </div>
            </div>
            <button
              className="inline-flex items-center rounded-full bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => assignOrder(o.order_id)}
              disabled={assigning}
            >
              {assigning ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Assigning…
                </>
              ) : (
                'Assign to unit'
              )}
            </button>
          </div>
        ))}
      </div>
    )
  }

  // ───────────────────────────── render ─────────────────────────────

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <button
          className="inline-flex items-center gap-2 text-sm text-sky-600 hover:text-sky-800"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to plan
        </button>
        {plan && (
          <div className="text-xs text-slate-500">
            Plan:{' '}
            <span className="font-medium text-slate-700">{plan.plan_name}</span>{' '}
            · {plan.delivery_start} → {plan.delivery_end}
          </div>
        )}
      </div>

      <DetailActionBar
        id={id}
        title={plate}
        description={reg || vehicle.vehicle_description || 'Vehicle details'}
      />

      {/* Unit summary card */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-semibold text-slate-800">{plate}</h2>
              {reg && (
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  {reg}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 capitalize">
                {unit.vehicle_type || 'vehicle'}
              </span>
              {trailer && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
                  trailer: {trailer.plate || trailer.license_plate || ''}
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
                {customersOnUnit.size}{' '}
                {customersOnUnit.size === 1 ? 'customer' : 'customers'}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="font-medium text-slate-700">{driverName}</div>
            {driver?.phone && <div>{driver.phone}</div>}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>Capacity</span>
            <span>
              {fmtNumber(usedKg)}kg / {fmtNumber(capacityKg)}kg
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full ${
                isOverCap
                  ? 'bg-red-500'
                  : isNearCap
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(usedPct, 100)}%` }}
            />
          </div>
          {isOverCap && (
            <div className="mt-1 text-xs text-red-600">
              Over capacity by {fmtNumber(usedPct - 100)}%
            </div>
          )}
        </div>
      </div>

      {/* Two columns: assigned vs unassigned */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Orders on this unit
          </h3>
          <AssignedOrdersList />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Unassigned orders in plan
          </h3>
          <UnassignedOrdersList />
        </div>
      </div>
    </div>
  )
}

export default LoadAssignmentSingle
