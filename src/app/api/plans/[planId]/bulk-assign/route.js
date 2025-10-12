import { fetchServerData } from '@/app/api/_lib/server-fetch'
import { NextResponse } from 'next/server'

const base = 'plans'

export async function POST(req, { params }) {
  try {
    const { planId } = (await params) || {}
    if (!planId)
      return NextResponse.json({ error: 'planId required' }, { status: 400 })

    const body = await req.json()
    // body shape:
    // {
    //   assignments: [{ plan_unit_id, items: [{ item_id, weight_kg }] }, ...],
    //   customerUnitCap?: number,
    //   enforce_family?: boolean
    // }

    const resp = await fetchServerData(
      `${base}/${planId}/bulk-assign`,
      'POST',
      body
    )
    // Your controller usually returns { message, ...data }
    return NextResponse.json(resp?.message ?? resp, { status: 200 })
  } catch (error) {
    console.error('bulk-assign error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
