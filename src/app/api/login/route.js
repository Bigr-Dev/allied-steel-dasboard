import { NextResponse } from 'next/server'
import { fetchServerData } from '../_lib/server-fetch'

// POST request for handling login
export async function POST(req) {
  const body = await req.json()
  const data = {
    email: body?.email,
    password: body?.password,
  }

  try {
    const response = await fetchServerData('login', 'POST', data)

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
