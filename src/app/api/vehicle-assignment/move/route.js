import { NextResponse } from 'next/server'

// Mock data for demonstration - replace with actual database operations
const mockAssignedUnits = [
  {
    plan_unit_id: 'preview-0',
    unit_type: 'rigid',
    driver_id: 'driver-1',
    driver_name: 'John Smith',
    rigid: { id: 'rigid-1', plate: 'ABC123', fleet_number: 'R001' },
    horse: null,
    trailer: null,
    capacity_kg: 5000,
    used_capacity_kg: 2500,
    customers: [
      {
        customer_id: 'customer-1',
        customer_name: 'Acme Corp',
        suburb_name: 'Downtown',
        route_name: 'Route A',
        orders: [
          {
            order_id: 'order-1',
            total_assigned_weight_kg: 1000,
            items: [
              {
                item_id: 'item-1',
                description: 'Office Supplies',
                assigned_weight_kg: 500,
                assignment_id: 'assign-1',
              },
              {
                item_id: 'item-2',
                description: 'Computer Equipment',
                assigned_weight_kg: 500,
                assignment_id: 'assign-2',
              },
            ],
          },
        ],
      },
    ],
  },
]

const mockUnassigned = [
  {
    load_id: 'load-1',
    order_id: 'order-2',
    item_id: 'item-3',
    customer_name: 'Tech Solutions',
    suburb_name: 'Midtown',
    route_name: 'Route B',
    weight_left: 750,
    description: 'Server Hardware',
  },
  {
    load_id: 'load-2',
    order_id: 'order-3',
    item_id: 'item-4',
    customer_name: 'Global Industries',
    suburb_name: 'Uptown',
    route_name: 'Route C',
    weight_left: 300,
    description: 'Manufacturing Parts',
  },
]

export async function POST(request) {
  try {
    const payload = await request.json()
    const {
      item_id,
      assignment_id,
      from_plan_unit_id,
      to_plan_unit_id,
      weight,
    } = payload

    console.log('[v0] Move item payload:', payload)

    // Handle move from unassigned to vehicle
    if (!from_plan_unit_id && to_plan_unit_id) {
      const itemIndex = mockUnassigned.findIndex(
        (item) => item.item_id === item_id
      )
      if (itemIndex === -1) {
        return NextResponse.json(
          { error: 'Item not found in unassigned list' },
          { status: 404 }
        )
      }

      const item = mockUnassigned[itemIndex]
      const unitIndex = mockAssignedUnits.findIndex(
        (unit) => unit.plan_unit_id === to_plan_unit_id
      )

      if (unitIndex === -1) {
        return NextResponse.json(
          { error: 'Target vehicle not found' },
          { status: 404 }
        )
      }

      // Check capacity
      const targetUnit = mockAssignedUnits[unitIndex]
      if (targetUnit.used_capacity_kg + weight > targetUnit.capacity_kg) {
        return NextResponse.json(
          { error: 'Would exceed vehicle capacity' },
          { status: 400 }
        )
      }

      // Remove from unassigned
      mockUnassigned.splice(itemIndex, 1)

      // Add to vehicle
      targetUnit.used_capacity_kg += weight

      let customerGroup = targetUnit.customers.find(
        (c) => c.customer_name === item.customer_name
      )
      if (!customerGroup) {
        customerGroup = {
          customer_id: null,
          customer_name: item.customer_name,
          suburb_name: item.suburb_name,
          route_name: item.route_name,
          orders: [],
        }
        targetUnit.customers.push(customerGroup)
      }

      let order = customerGroup.orders.find((o) => o.order_id === item.order_id)
      if (!order) {
        order = {
          order_id: item.order_id,
          total_assigned_weight_kg: 0,
          items: [],
        }
        customerGroup.orders.push(order)
      }

      order.items.push({
        item_id: item.item_id,
        description: item.description,
        assigned_weight_kg: weight,
        assignment_id: `assign-${Date.now()}`,
      })
      order.total_assigned_weight_kg += weight
    }

    // Handle move from vehicle to unassigned
    else if (from_plan_unit_id && !to_plan_unit_id) {
      const unitIndex = mockAssignedUnits.findIndex(
        (unit) => unit.plan_unit_id === from_plan_unit_id
      )
      if (unitIndex === -1) {
        return NextResponse.json(
          { error: 'Source vehicle not found' },
          { status: 404 }
        )
      }

      const sourceUnit = mockAssignedUnits[unitIndex]
      let foundItem = null
      let foundCustomer = null
      let foundOrder = null

      // Find and remove item
      for (const customer of sourceUnit.customers) {
        for (const order of customer.orders) {
          const itemIndex = order.items.findIndex(
            (item) => item.item_id === item_id
          )
          if (itemIndex !== -1) {
            foundItem = order.items[itemIndex]
            foundCustomer = customer
            foundOrder = order

            order.items.splice(itemIndex, 1)
            order.total_assigned_weight_kg -= foundItem.assigned_weight_kg
            sourceUnit.used_capacity_kg -= foundItem.assigned_weight_kg
            break
          }
        }
        if (foundItem) break
      }

      if (!foundItem) {
        return NextResponse.json(
          { error: 'Item not found in source vehicle' },
          { status: 404 }
        )
      }

      // Clean up empty orders and customers
      sourceUnit.customers = sourceUnit.customers
        .map((customer) => ({
          ...customer,
          orders: customer.orders.filter((order) => order.items.length > 0),
        }))
        .filter((customer) => customer.orders.length > 0)

      // Add to unassigned
      mockUnassigned.push({
        load_id: `load-${Date.now()}`,
        order_id: foundOrder.order_id,
        item_id: foundItem.item_id,
        customer_name: foundCustomer.customer_name,
        suburb_name: foundCustomer.suburb_name,
        route_name: foundCustomer.route_name,
        weight_left: foundItem.assigned_weight_kg,
        description: foundItem.description,
      })
    }

    // Handle move between vehicles
    else if (
      from_plan_unit_id &&
      to_plan_unit_id &&
      from_plan_unit_id !== to_plan_unit_id
    ) {
      // First unassign, then assign
      // This is a simplified implementation - in practice you'd do this atomically
      await POST({
        json: () => ({
          item_id,
          from_plan_unit_id,
          to_plan_unit_id: null,
          weight,
        }),
      })
      await POST({
        json: () => ({
          item_id,
          from_plan_unit_id: null,
          to_plan_unit_id,
          weight,
        }),
      })
    }

    return NextResponse.json({
      assigned_units: mockAssignedUnits,
      unassigned: mockUnassigned,
    })
  } catch (error) {
    console.error('[v0] Move item error:', error)
    return NextResponse.json({ error: 'Failed to move item' }, { status: 500 })
  }
}
