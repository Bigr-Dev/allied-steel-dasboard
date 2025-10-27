import { NextResponse } from 'next/server'
import { fetchServerData } from '../_lib/server-fetch'

const url = 'branches'

// *****************************
// get branches
// *****************************
export async function GET(req) {
  try {
    const response = await fetchServerData(url, 'GET')
    // console.log('response :>> ', response)
    return NextResponse.json(response.message, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// *****************************
// add a branch
// *****************************
export async function POST(req) {
  const body = await req.json()
  try {
    const response = await fetchServerData(url, 'POST', body)
    //console.log('response :>> ', response)
    const data = { ...body, id: response.message.id }
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
