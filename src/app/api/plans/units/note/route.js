import { fetchServerData } from '@/app/api/_lib/server-fetch'
import { NextResponse } from 'next/server'

export async function POST(req, { params }) {
  // const { planId, unitId } = await params
  const body = await req.json()
  try {
    //console.log('body :>> ', body)
    const response = await fetchServerData(`plans/units/note`, 'POST', body)
    //console.log('response :>> ', response)
    return NextResponse.json(response?.data, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
