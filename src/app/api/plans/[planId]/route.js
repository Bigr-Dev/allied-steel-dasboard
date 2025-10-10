import { NextResponse } from 'next/server'
import { fetchServerData } from '../../_lib/server-fetch'

const url = 'plans'

// *****************************
// get plans by planId
// *****************************
export async function GET(req, { params }) {
  const { planId } = await params
  try {
    const response = await fetchServerData(`${url}/${planId}`, 'GET')

    return NextResponse.json(response.message, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// *****************************
// get plans preview
// *****************************
export async function POST(req, { params }) {
  const { ...test } = await params
  console.log('test :>> ', test)
  const body = await req.json()
  try {
    const response = await fetchServerData(url, 'POST', body)
    return NextResponse.json(response?.message || response?.data, {
      status: 200,
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// *****************************
// delete a plan by id
// *****************************
export async function DELETE(req, { params }) {
  const { planId } = await params

  try {
    const response = await fetchServerData(`${url}/${planId}`, 'DELETE')
    console.log('response :plans/planId>> ', response)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
