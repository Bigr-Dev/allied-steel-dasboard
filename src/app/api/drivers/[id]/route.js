import { NextResponse } from 'next/server'
import { fetchServerData } from '../../_lib/server-fetch'

const url = 'drivers'

// *****************************
// get a driver by id
// *****************************
export async function GET(req, { params }) {
  const { id } = await params

  try {
    const response = await fetchServerData(`${url}/${id}`, 'GET')

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// *****************************
// update a driver by id
// *****************************
export async function PUT(req, { params }) {
  const { id } = await params
  const body = await req.json()
  try {
    const response = await fetchServerData(`${url}/${id}`, 'PUT', body)

    return NextResponse.json(response, { status: 200 })
    // return NextResponse.json({ status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// *****************************
// delete a driver by id
// *****************************
export async function DELETE(req, { params }) {
  const { id } = await params

  try {
    const response = await fetchServerData(`${url}/${id}`, 'DELETE')

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
