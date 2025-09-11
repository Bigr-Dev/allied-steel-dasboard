import { NextResponse } from 'next/server'
import { fetchServerData } from '../_lib/server-fetch'

const url = 'users'

// *****************************
// get users
// *****************************
export async function GET(req) {
  try {
    const response = await fetchServerData(url, 'GET')

    return NextResponse.json(response.message, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// *****************************
// add user
// *****************************
export async function POST(req) {
  const body = await req.json()
  try {
    const response = await fetchServerData(url, 'POST', body)
    return NextResponse.json(response?.message, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
