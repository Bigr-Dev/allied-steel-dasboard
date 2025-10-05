import { useGlobalContext } from '@/context/global-context'
import { useAuth } from '@/context/initial-states/auth-state'
import React, { useState } from 'react'

const AssignmentForm = ({ id, onCancel }) => {
  const {
    assignment: { data: assignment },
  } = useGlobalContext()
  const {
    current_user: { currentUser: current_user },
  } = useAuth()

  console.log('assignment :>> ', assignment)

  const plan = assignment?.plan || {}
  const assigned_units = assignment?.assigned_units || []
  const idle_units_by_branch = assignment?.idle_units_by_branch || []
  const unassigned = assignment?.unassigned || []

  function todayTomorrow() {
    const now = new Date()
    const iso = (d) =>
      new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10)

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      yesterday: iso(yesterday),
      today: iso(now),
      tomorrow: iso(tomorrow),
    }
  }

  const { today, tomorrow, yesterday } = todayTomorrow()

  const plans = {
    date_from: yesterday,
    date_to: tomorrow,
    branch_id: current_user?.branch_id,
    customer_id: null,
    include_units: true,
    include_counts: true,
    include_branch_name: true,
  }
  const auto_assign = {
    departure_date: tomorrow, // default: tomorrow
    cutoff_date: today, // default: today
    branch_id: current_user?.branch_id,
    customer_id: null,
    commit: false, // preview (no DB writes) if false
    notes: null,
    routeAffinitySlop: 0.25,
    capacityHeadroom: 0.1,
    lengthBufferMm: 600,
    maxTrucksPerZone: 2,
    ignoreLengthIfMissing: false,
    ignoreDepartment: false,
    customerUnitCap: 2,
    routeAffinitySlop: 0.25, // NEW
  }
  const manual_assign = {
    item_id: null,
    weight_kg: 0,
    note: 'manual',
  }

  const [formData, setFormData] = useState({
    plans,
    auto_assign,
    manual_assign,
  })

  const tabs = [
    { name: 'Assignment Plans', value: 'plans' },
    { name: 'Auto Assignment', value: 'auto_assign' },
    { name: 'Manual Assignment', value: 'manual_assign' },
  ]

  const plans_details = []
  const auto_assign_details = []
  const manual_assign_details = []

  const handleChange = (e) => {}

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    //onCancel()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4  grid-cols-1">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg text-[#003e69]  font-bold tracking-tight uppercase">
              {/* {driver?.id ? `Edit Driver` : 'Add New Driver'} */}
              Create a New Plan
            </h2>
            <p className="text-[#428bca]">
              {/* {driver?.id ? driver.name : 'Enter Driver Details'} */}
              Adjust the auto-assignment settings
            </p>
          </div>
        </div>
      </div>
    </form>
  )
}

export default AssignmentForm
