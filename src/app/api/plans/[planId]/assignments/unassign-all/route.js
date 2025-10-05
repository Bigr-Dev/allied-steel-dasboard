import { fetchServerData } from '@/app/api/_lib/server-fetch'
import { NextResponse } from 'next/server'

const url = 'plans'

// *****************************
// get plans by planId
// *****************************
export async function POST(req, { params }) {
  const { planId } = await params

  const body = await req.json()
  try {
    const response = await fetchServerData(
      `${url}/${planId}/assignments/unassign-all`,
      'POST',
      body
    )
    return NextResponse.json(response?.message || response?.data, {
      status: 200,
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
