import { NextResponse } from 'next/server'
import { fetchServerData } from '../_lib/server-fetch'

const url = 'plans'

// *****************************
// get vehicle assignment plans
// *****************************
export async function GET(req) {
  try {
    const response = await fetchServerData(url, 'GET')

    return NextResponse.json(response?.data, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// *****************************
// get vehicle assignment data
// *****************************
export async function POST(req) {
  const body = await req?.json()
  console.log('body :>> ', body)
  try {
    const response = await fetchServerData('auto-assign-loads', 'POST', body)
    console.log('loads response :>> ', response)
    return NextResponse.json(response?.data, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
