import { NextResponse } from 'next/server'
import { fetchServerData } from '../../_lib/server-fetch'

// POST request for handling toute
export async function GET(req, { params }) {
  const { id } = await params
  console.log('params :>> ', id)

  try {
    const response = await fetchServerData(`routes/${id}`, 'GET')

    return NextResponse.json(response?.message, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
