// import { NextResponse } from 'next/server'
// import { fetchServerData } from '../_lib/server-fetch'
// import { cookies } from 'next/headers'

// // POST request for handling login
// export async function POST({ req }) {
//   const body = await req?.json()
//   console.log('req :>> ', body)

// const cookieStore = await cookies()
// const token = cookieStore?.get('access_token')?.value

//   // Set up the options for the fetch request
//   const options = {
//     method: 'POST',
//     headers: {
//       'Access-Control-Allow-Origin': 'http://localhost:3000',
//       'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//       'Content-Type': 'application/json',
//       Authorization: token ? `Bearer ${token}` : '', // Correct Authorization header
//     },
//     body: body ? JSON.stringify(body) : null,
//   }
//   try {
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_SERVER_URL}/grouped-routes/loads`,
//       options
//     )
//     console.log('loads response :>> ', response)
//     return NextResponse.json('success', { status: 200 })
//   } catch (error) {
//     console.error('Error fetching data:', error)
//     return NextResponse.json({ error: error.message }, { status: 500 })
//   }
// }

// // import { NextResponse } from 'next/server'
// // import { fetchServerData } from '../_lib/server-fetch'

// // // POST request for handling login
// // export async function POST(req) {
// //   const body = await req?.json()
// //   console.log('req :>> ', body)

// //   const response = await fetch(`grouped-routes/loads`, 'POST', req)
// //   console.log('loads response :>> ', response)
// //   return NextResponse.json(response?.data?.results, { status: 200 })
// // }

// app/api/grouped-routes/loads/route.js
// import { NextResponse } from 'next/server'
// import { cookies } from 'next/headers'

// export async function POST(req) {
//   const body = await req.json()
//   const cookieStore = await cookies()
//   const token = cookieStore?.get('access_token')?.value

//   const response = await fetch(
//     `${process.env.NEXT_PUBLIC_SERVER_URL}/auto-assign/loads`,
//     {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       },
//       body: body ? JSON.stringify(body) : null,
//       // cache: 'no-store',
//     }
//   )

//   const payload = await response.json()

//   console.log('payload :>> ', payload)

//   // Mirror upstream status & body
//   return NextResponse.json(payload ?? { ok: true }, { status: upstream.status })
// }

import { NextResponse } from 'next/server'
import { fetchServerData } from '../_lib/server-fetch'

// POST request for handling login
export async function POST(req) {
  const body = await req?.json()
  try {
    const response = await fetchServerData('auto-assign/loads', 'POST', body)
    console.log('loads response :>> ', response?.data)
    return NextResponse.json(response?.data, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Only include this if the browser calls THIS route directly and you need CORS.
 * Otherwise, omit it.
 */
// export function OPTIONS() {
//   return new NextResponse(null, {
//     status: 204,
//     headers: {
//       'Access-Control-Allow-Origin':
//         process.env.NEXT_PUBLIC_APP_ORIGIN || 'http://localhost:3000',
//       'Access-Control-Allow-Methods': 'POST, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//       'Access-Control-Max-Age': '86400',
//     },
//   })
// }
