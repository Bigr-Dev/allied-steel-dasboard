import { NextResponse } from 'next/server'
import { fetchServerData } from '../_lib/server-fetch'

// POST request for handling login
export async function GET(req) {
  try {
    const response = await fetchServerData('drivers', 'GET')
    //  console.log('response :>> ', response)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
