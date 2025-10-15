import { NextResponse } from 'next/server'
import { fetchServerData } from '../../_lib/server-fetch'

const url = 'plans'

// *****************************
// get plans by planId
// *****************************
export async function GET(req, { params }) {
  const { planId } = await params
  try {
    const response = await fetchServerData(`${url}/${planId}`, 'GET')

    return NextResponse.json(response.message, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// *****************************
// get plans preview
// *****************************
export async function POST(req, { params }) {
  const { ...test } = await params
  console.log('test :>> ', test)
  const body = await req.json()
  try {
    const response = await fetchServerData(url, 'POST', body)
    return NextResponse.json(response?.message || response?.data, {
      status: 200,
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// *****************************
// delete a plan by id
// *****************************
export async function DELETE(req, { params }) {
  const { planId } = await params

  try {
    const response = await fetchServerData(`${url}/${planId}`, 'DELETE')
    console.log('response :plans/planId>> ', response)
    return NextResponse.json(response?.data?.plan_id, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// export async function POST(request) {
//   try {
//     const payload = await request?.json()
//     const {
//       item_id,
//       assignment_id,
//       from_plan_unit_id,
//       to_plan_unit_id,
//       weight,
//     } = payload
//     console.log('payload :>> ', payload)
//     const url = `${API_URL}/${assignment_id}`
//     // console.log('[v0] Move item payload:', payload)

//     // // Handle move from unassigned to vehicle
//     // if (!from_plan_unit_id && to_plan_unit_id) {
//     //   const itemIndex = mockUnassigned.findIndex(
//     //     (item) => item.item_id === item_id
//     //   )
//     //   if (itemIndex === -1) {
//     //     return NextResponse.json(
//     //       { error: 'Item not found in unassigned list' },
//     //       { status: 404 }
//     //     )
//     //   }

//     //   const item = mockUnassigned[itemIndex]
//     //   const unitIndex = mockAssignedUnits.findIndex(
//     //     (unit) => unit.plan_unit_id === to_plan_unit_id
//     //   )

//     //   if (unitIndex === -1) {
//     //     return NextResponse.json(
//     //       { error: 'Target vehicle not found' },
//     //       { status: 404 }
//     //     )
//     //   }

//     //   // Check capacity
//     //   const targetUnit = mockAssignedUnits[unitIndex]
//     //   if (targetUnit.used_capacity_kg + weight > targetUnit.capacity_kg) {
//     //     return NextResponse.json(
//     //       { error: 'Would exceed vehicle capacity' },
//     //       { status: 400 }
//     //     )
//     //   }

//     //   // Remove from unassigned
//     //   mockUnassigned.splice(itemIndex, 1)

//     //   // Add to vehicle
//     //   targetUnit.used_capacity_kg += weight

//     //   let customerGroup = targetUnit.customers.find(
//     //     (c) => c.customer_name === item.customer_name
//     //   )
//     //   if (!customerGroup) {
//     //     customerGroup = {
//     //       customer_id: null,
//     //       customer_name: item.customer_name,
//     //       suburb_name: item.suburb_name,
//     //       route_name: item.route_name,
//     //       orders: [],
//     //     }
//     //     targetUnit.customers.push(customerGroup)
//     //   }

//     //   let order = customerGroup.orders.find((o) => o.order_id === item.order_id)
//     //   if (!order) {
//     //     order = {
//     //       order_id: item.order_id,
//     //       total_assigned_weight_kg: 0,
//     //       items: [],
//     //     }
//     //     customerGroup.orders.push(order)
//     //   }

//     //   order.items.push({
//     //     item_id: item.item_id,
//     //     description: item.description,
//     //     assigned_weight_kg: weight,
//     //     assignment_id: `assign-${Date.now()}`,
//     //   })
//     //   order.total_assigned_weight_kg += weight
//     // }

//     // // Handle move from vehicle to unassigned
//     // else if (from_plan_unit_id && !to_plan_unit_id) {
//     //   const unitIndex = mockAssignedUnits.findIndex(
//     //     (unit) => unit.plan_unit_id === from_plan_unit_id
//     //   )
//     //   if (unitIndex === -1) {
//     //     return NextResponse.json(
//     //       { error: 'Source vehicle not found' },
//     //       { status: 404 }
//     //     )
//     //   }

//     //   const sourceUnit = mockAssignedUnits[unitIndex]
//     //   let foundItem = null
//     //   let foundCustomer = null
//     //   let foundOrder = null

//     //   // Find and remove item
//     //   for (const customer of sourceUnit.customers) {
//     //     for (const order of customer.orders) {
//     //       const itemIndex = order.items.findIndex(
//     //         (item) => item.item_id === item_id
//     //       )
//     //       if (itemIndex !== -1) {
//     //         foundItem = order.items[itemIndex]
//     //         foundCustomer = customer
//     //         foundOrder = order

//     //         order.items.splice(itemIndex, 1)
//     //         order.total_assigned_weight_kg -= foundItem.assigned_weight_kg
//     //         sourceUnit.used_capacity_kg -= foundItem.assigned_weight_kg
//     //         break
//     //       }
//     //     }
//     //     if (foundItem) break
//     //   }

//     //   if (!foundItem) {
//     //     return NextResponse.json(
//     //       { error: 'Item not found in source vehicle' },
//     //       { status: 404 }
//     //     )
//     //   }

//     //   // Clean up empty orders and customers
//     //   sourceUnit.customers = sourceUnit.customers
//     //     .map((customer) => ({
//     //       ...customer,
//     //       orders: customer.orders.filter((order) => order.items.length > 0),
//     //     }))
//     //     .filter((customer) => customer.orders.length > 0)

//     //   // Add to unassigned
//     //   mockUnassigned.push({
//     //     load_id: `load-${Date.now()}`,
//     //     order_id: foundOrder.order_id,
//     //     item_id: foundItem.item_id,
//     //     customer_name: foundCustomer.customer_name,
//     //     suburb_name: foundCustomer.suburb_name,
//     //     route_name: foundCustomer.route_name,
//     //     weight_left: foundItem.assigned_weight_kg,
//     //     description: foundItem.description,
//     //   })
//     // }

//     // // Handle move between vehicles
//     // else if (
//     //   from_plan_unit_id &&
//     //   to_plan_unit_id &&
//     //   from_plan_unit_id !== to_plan_unit_id
//     // ) {
//     //   // First unassign, then assign
//     //   // This is a simplified implementation - in practice you'd do this atomically
//     //   await POST({
//     //     json: () => ({
//     //       item_id,
//     //       from_plan_unit_id,
//     //       to_plan_unit_id: null,
//     //       weight,
//     //     }),
//     //   })
//     //   await POST({
//     //     json: () => ({
//     //       item_id,
//     //       from_plan_unit_id: null,
//     //       to_plan_unit_id,
//     //       weight,
//     //     }),
//     //   })
//     // }

//     const response = await fetchServerData(``, 'POST', payload)
//     console.log('response :>> ', response)
//     return NextResponse.json(response)
//     // return NextResponse.json({
//     //   assigned_units: mockAssignedUnits,
//     //   unassigned: mockUnassigned,
//     // })
//   } catch (error) {
//     console.error('[v0] Move item error:', error)
//     return NextResponse.json({ error: 'Failed to move item' }, { status: 500 })
//   }
// }
