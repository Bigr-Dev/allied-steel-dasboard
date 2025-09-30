import { NextResponse } from 'next/server'
import { fetchServerData } from '../_lib/server-fetch'

const url = '/auto-assign-loads'

// *****************************
// get vehicle assignment data
// *****************************
export async function POST(req) {
  const body = await req?.json()
  //console.log('body :>> ', body)
  try {
    const response = await fetchServerData('auto-assign-loads', 'POST', body)
    //console.log('loads response :>> ', response?.data)
    return NextResponse.json(response?.data, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
// export async function POST(req) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const departure_date = searchParams.get('date')
//     const branchId = searchParams.get('branch_id')
//     const customerId = searchParams.get('customer_id')
//     const preview = searchParams.get('preview') === 'true'
//     const commit = false

//     const response = await fetchServerData(
//       url,
//       { departure_date, commit },
//       'POST'
//     )
//     console.log('response :>> ', response)
//     return NextResponse.json(response.message, { status: 200 })
//   } catch (error) {
//     console.error('Error fetching data:', error)
//     return NextResponse.json({ error: error.message }, { status: 500 })
//   }
// }

// Mock data - replace with actual database queries
// const mockData = {
//   plan: {
//     departure_date: '2024-01-15',
//     commit: false,
//   },
//   assigned_units: [
//     {
//       plan_unit_id: 'preview-1',
//       unit_type: 'rigid',
//       driver_id: 'driver-1',
//       driver_name: 'John Smith',
//       rigid: { id: 'rigid-1', plate: 'ABC123', fleet_number: 'R001' },
//       horse: null,
//       trailer: null,
//       capacity_kg: 5000,
//       used_capacity_kg: 3200,
//       customers: [
//         {
//           customer_id: 'cust-1',
//           customer_name: 'Acme Corp',
//           suburb_name: 'Downtown',
//           route_name: 'Route A',
//           orders: [
//             {
//               order_id: 'order-1',
//               total_assigned_weight_kg: 1500,
//               items: [
//                 {
//                   item_id: 'item-1',
//                   description: 'Steel Beams - 6m',
//                   assigned_weight_kg: 800,
//                   assignment_id: 'assign-1',
//                 },
//                 {
//                   item_id: 'item-2',
//                   description: 'Concrete Blocks',
//                   assigned_weight_kg: 700,
//                   assignment_id: 'assign-2',
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     },
//     {
//       plan_unit_id: 'preview-2',
//       unit_type: 'horse+trailer',
//       driver_id: null,
//       driver_name: null,
//       rigid: null,
//       horse: { id: 'horse-1', plate: 'DEF456', fleet_number: 'H001' },
//       trailer: { id: 'trailer-1', plate: 'GHI789', fleet_number: 'T001' },
//       capacity_kg: 8000,
//       used_capacity_kg: 6800,
//       customers: [
//         {
//           customer_id: 'cust-2',
//           customer_name: 'Industrial Supplies',
//           suburb_name: 'North District',
//           route_name: 'Route D',
//           orders: [
//             {
//               order_id: 'order-4',
//               total_assigned_weight_kg: 6800,
//               items: [
//                 {
//                   item_id: 'item-5',
//                   description: 'Heavy Machinery Parts',
//                   assigned_weight_kg: 6800,
//                   assignment_id: 'assign-5',
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     },
//   ],
//   unassigned: [
//     {
//       load_id: 'load-1',
//       order_id: 'order-2',
//       item_id: 'item-3',
//       customer_name: 'BuildCorp',
//       suburb_name: 'Industrial',
//       route_name: 'Route B',
//       weight_left: 1200,
//       description: 'Timber Planks - 4m',
//     },
//     {
//       load_id: 'load-2',
//       order_id: 'order-3',
//       item_id: 'item-4',
//       customer_name: 'Metro Supplies',
//       suburb_name: 'Westside',
//       route_name: 'Route C',
//       weight_left: 800,
//       description: 'Plumbing Fixtures',
//     },
//     {
//       load_id: 'load-3',
//       order_id: 'order-5',
//       item_id: 'item-6',
//       customer_name: 'Construction Co',
//       suburb_name: 'Eastside',
//       route_name: 'Route A',
//       weight_left: 1500,
//       description: 'Cement Bags',
//     },
//   ],
// }

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url)
//     const date = searchParams.get('date')
//     const branchId = searchParams.get('branch_id')
//     const customerId = searchParams.get('customer_id')
//     const preview = searchParams.get('preview') === 'true'

//     // Simulate API delay
//     await new Promise((resolve) => setTimeout(resolve, 500))

//     // In a real implementation, you would:
//     // 1. Query the database based on the parameters
//     // 2. Apply filters for branch_id, customer_id, date
//     // 3. Return the appropriate data structure

//     return NextResponse.json(mockData)
//   } catch (error) {
//     console.error('Error fetching vehicle assignment data:', error)
//     return NextResponse.json(
//       { error: 'Failed to fetch assignment data' },
//       { status: 500 }
//     )
//   }
// }
