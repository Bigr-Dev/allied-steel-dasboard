import { fetchServerData } from '@/app/api/_lib/server-fetch'
import { NextResponse } from 'next/server'

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
// get plans by planId
// *****************************
// export async function POST(req, { params }) {
//   const { planId, unitId } = await params

//   const body = await req.json()
//   try {
//     const response = await fetchServerData(
//       `${url}/${planId}/units/${unitId}/assign`,
//       'POST',
//       body
//     )
//     return NextResponse.json(response?.message || response?.data, {
//       status: 200,
//     })
//   } catch (error) {
//     console.error('Error fetching data:', error)
//     return NextResponse.json({ error: error.message }, { status: 500 })
//   }
// }

// POST /api/plans/:planId/units/:unitId/assign
export async function POST(req, ctx) {
  try {
    // ⬇️ params must be awaited in Next.js 15 dynamic API routes
    const { planId, unitId } = await ctx.params

    if (!planId || !unitId) {
      return NextResponse.json(
        { error: 'planId and unitId required' },
        { status: 400 }
      )
    }

    const incoming = await req.json()
    const items = Array.isArray(incoming?.items)
      ? incoming.items
      : incoming?.items
      ? [incoming.items]
      : []

    const body = {
      plan_id: planId,
      plan_unit_id: unitId,
      items, // [{ item_id, weight_kg?, note? }]
      // intentionally no customerUnitCap
    }

    const resp = await fetchServerData(
      `plans/${planId}/units/${unitId}/assign`,
      'POST',
      body
    )

    return NextResponse.json(resp?.message ?? resp, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message ?? error) },
      { status: 500 }
    )
  }
}

// // POST /api/plans/:planId/units/:unitId/assign
// export async function POST(req, { params }) {
//   try {
//     const { planId, unitId } = (await params) || {}
//     if (!planId || !unitId) {
//       return NextResponse.json(
//         { error: 'planId and unitId required' },
//         { status: 400 }
//       )
//     }

//     const incoming = await req.json()
//     // Force the shape your server expects AND remove any cap knobs
//     const body = {
//       plan_id: planId,
//       plan_unit_id: unitId,
//       items: Array.isArray(incoming?.items)
//         ? incoming.items
//         : incoming?.items
//         ? [incoming.items]
//         : [],
//       // intentionally no customerUnitCap
//     }

//     const resp = await fetchServerData(
//       `plans/${planId}/units/${unitId}/assign`,
//       'POST',
//       body
//     )

//     return NextResponse.json(resp?.message ?? resp, { status: 200 })
//   } catch (error) {
//     return NextResponse.json(
//       { error: String(error?.message ?? error) },
//       { status: 500 }
//     )
//   }
// }
