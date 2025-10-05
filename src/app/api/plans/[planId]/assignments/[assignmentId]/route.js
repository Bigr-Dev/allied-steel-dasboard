import { fetchServerData } from '@/app/api/_lib/server-fetch'
import { NextResponse } from 'next/server'

const url = 'plans'

// *****************************
// delete a user by id
// *****************************
export async function DELETE(req, { params }) {
  const { id, planId, assignmentId } = await params

  try {
    const response = await fetchServerData(
      `${url}/${planId}/assignments/${assignmentId}`,
      'DELETE'
    )

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
