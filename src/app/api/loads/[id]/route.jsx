import { NextResponse } from 'next/server'
import { fetchServerData } from '../../_lib/server-fetch'

// POST request for handling toute
export async function GET(req, { params }) {
  // console.log('req :>> ', req)
  // const test = await params
  // console.log('params :>> ', test)

  try {
    // const response = await fetchServerData(`routes/${id}`, 'GET')
    const response = await fetchServerData('loads', 'GET')
    return NextResponse.json(response.data.results, { status: 200 })
    // return NextResponse.json(response?.message, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
