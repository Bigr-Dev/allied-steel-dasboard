import { fetchServerData } from '@/app/api/_lib/server-fetch'
import { NextResponse } from 'next/server'

const base = 'plans'

export async function POST(req, { params }) {
  try {
    const { planId } = (await params) || {}
    if (!planId)
      return NextResponse.json({ error: 'planId required' }, { status: 400 })

    const body = await req.json()
    console.log('body :/api/plans/[planId]/unassign [POST]>> ', body)
    // body shape:
    // {
    //   items: [{ plan_unit_id, item_id }, ...],
    //   to_bucket?: boolean,           // default true
    //   bucket_reason?: string,        // e.g. 'manual'
    //   remove_empty_unit?: boolean    // default true
    // }

    const resp = await fetchServerData(
      `${base}/${planId}/unassign`,
      'POST',
      body
    )
    console.log('resp :/api/plans/[planId]/unassign [POST]>> ', resp)
    return NextResponse.json(resp?.message ?? resp, { status: 200 })
  } catch (error) {
    console.error('unassign error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
