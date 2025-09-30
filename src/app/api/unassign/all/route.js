import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { vehicle_id } = await request.json()

    if (!vehicle_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: vehicle_id' },
        { status: 400 }
      )
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // In a real implementation, you would:
    // 1. Find all assignments for the vehicle
    // 2. Delete all assignment records for this vehicle
    // 3. Update all items to unassigned status
    // 4. Return updated assignment data

    // Mock successful response
    const updatedData = {
      assigned_units: [
        // Mock updated assigned units data with empty vehicle
      ],
      unassigned: [
        // Mock updated unassigned data with all items from vehicle
      ],
    }

    return NextResponse.json(updatedData)
  } catch (error) {
    console.error('Error unassigning all items:', error)
    return NextResponse.json(
      { error: 'Failed to unassign all items' },
      { status: 500 }
    )
  }
}
