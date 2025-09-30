import { NextResponse } from 'next/server'
import { fetchServerData } from '../_lib/server-fetch'

// POST request for handling login
export async function POST(req) {
  // const body = await req?.json()
  try {
    const { date, branch_id, customer_id, commit = false } = await req.json()
    const response = await fetchServerData('auto-assign-loads', 'POST', {
      date,
      branch_id,
      customer_id,
      commit,
    })
    console.log('loads response :>> ', response)
    return NextResponse.json(response?.data, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// export async function POST(request) {
//   try {
//     const {
//       date,
//       branch_id,
//       customer_id,
//       commit = false,
//     } = await request.json()

//     if (!date) {
//       return NextResponse.json(
//         { error: 'Missing required parameter: date' },
//         { status: 400 }
//       )
//     }

//     // Simulate API delay
//     await new Promise((resolve) => setTimeout(resolve, 1000))

//     // In a real implementation, you would:
//     // 1. Run auto-assignment algorithm based on parameters
//     // 2. If commit=true, save the assignments to database
//     // 3. If commit=false, return preview data only
//     // 4. Consider constraints like vehicle capacity, routes, etc.

//     // Mock successful response
//     const assignmentData = {
//       plan: {
//         departure_date: date,
//         commit: commit,
//       },
//       assigned_units: [
//         // Mock auto-assigned units
//       ],
//       unassigned: [
//         // Mock remaining unassigned items
//       ],
//     }

//     return NextResponse.json(assignmentData)
//   } catch (error) {
//     console.error('Error in auto assignment:', error)
//     return NextResponse.json(
//       { error: 'Failed to auto-assign items' },
//       { status: 500 }
//     )
//   }
// }
