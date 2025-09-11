import { NextResponse } from 'next/server'
import { fetchServerData } from '../_lib/server-fetch'

const url = 'drivers'

// *****************************
// get drivers
// *****************************
export async function GET(req) {
  try {
    const response = await fetchServerData(url, 'GET')
    //  console.log('response :>> ', response)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// *****************************
// add driver
// *****************************
export async function POST(req) {
  const body = await req.json()
  try {
    const response = await fetchServerData(url, 'POST', body)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
