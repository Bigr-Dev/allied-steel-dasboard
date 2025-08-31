import { NextResponse } from 'next/server'
import { fetchServerData, serverLogout } from '../_lib/server-fetch'

// POST request for handling login
export async function POST(req) {
  try {
    const response = await serverLogout()
    console.log('response :logout route>> ', response)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
