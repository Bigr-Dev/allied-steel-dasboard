import { NextResponse } from 'next/server'

const url = 'unassign'

export async function POST(request, { params }) {
  try {
    const itemId = params?.id
    const body = await request?.json()

    if (!itemId) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 })
    }

    // Simulate API delay
    // await new Promise((resolve) => setTimeout(resolve, 300))
    const response = await fetchServerData(`${url}/${itemId}`, 'POST', body)
    // In a real implementation, you would:
    // 1. Find the assignment record by item_id
    // 2. Delete the assignment record
    // 3. Update the item status to unassigned
    // 4. Return updated assignment data
    console.log('response :>> ', response)
    // Mock successful response
    const updatedData = {
      assigned_units: [
        // Mock updated assigned units data
      ],
      unassigned: [
        // Mock updated unassigned data
      ],
    }

    return NextResponse.json(updatedData)
  } catch (error) {
    console.error('Error unassigning item:', error)
    return NextResponse.json(
      { error: 'Failed to unassign item' },
      { status: 500 }
    )
  }
}
