import { NextResponse } from 'next/server'
import { fetchServerData } from '../../_lib/server-fetch'

const url = 'plans/add-plan'

// *****************************
// create plan
// *****************************
export async function POST(req) {
  try {
    const body = await req?.json()
    //  console.log('body :>> ', body)
    const response = await fetchServerData(url, 'POST', body)
    // console.log('loads response :>> ', response?.data?.plan)
    // if ((response && response?.status) || response?.statusCode == 500) {
    //   return NextResponse.json({ error: response?.message }, { status: 500 })
    // }
    return NextResponse.json(response?.data || response, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
