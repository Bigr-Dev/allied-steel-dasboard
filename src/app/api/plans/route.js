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
    const response = await fetchServerData('plans', 'POST', body)
    console.log('loads response :>> ', response)
    if (response && response?.status == 500) {
      return NextResponse.json({ error: response?.message }, { status: 500 })
    }
    return NextResponse.json(response?.data || response, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// *****************************
// delete a user by id
// *****************************
export async function DELETE(req, { params }) {
  const { id, planId } = await params

  try {
    const response = await fetchServerData(`${url}/${planId}`, 'DELETE')
    console.log('response :>> /plans', response)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
