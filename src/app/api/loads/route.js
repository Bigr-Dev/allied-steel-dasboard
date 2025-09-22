import { NextResponse } from 'next/server'
import { fetchServerData } from '../_lib/server-fetch'

// POST request for handling login
export async function GET(req, { params }) {
  const { searchParams } = req.nextUrl
  let url = 'loads?'
  if (searchParams.get('branch_id'))
    url = url + `branch_id=${searchParams.get('branch_id')}&`
  if (searchParams.get('date')) url = url + `date=${searchParams.get('date')}&`
  if (searchParams.get('includeItems'))
    url = url + `includeItems=${searchParams.get('includeItems')}`
  // console.log('url :>> ', url)
  try {
    const response = await fetchServerData(url, 'GET')
    //console.log('loads response :>> ', response.data.results)
    return NextResponse.json(response.data.results, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
