// *****************************
// get plans by planId

import { fetchServerData } from '@/app/api/_lib/server-fetch'
import { NextResponse } from 'next/server'

// *****************************
export async function GET(req, { params }) {
  const { planId, unitId } = await params
  try {
    const response = await fetchServerData(
      `${url}/${planId}/units/${unitId}`,
      'GET'
    )

    return NextResponse.json(response.message, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
