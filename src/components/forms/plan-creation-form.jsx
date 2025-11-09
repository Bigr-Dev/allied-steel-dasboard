import { useGlobalContext } from '@/context/global-context'
import { useAuth } from '@/context/initial-states/auth-state'
import { useState } from 'react'
import DetailCard from '../ui/detail-card'
import DynamicInput from '../ui/dynamic-input'
import { Button } from '../ui/button'
import { Save } from 'lucide-react'

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

const { today } = todayTomorrow()

const PlanCreationForm = ({ id, onCancel }) => {
  const { branches, fetchAssignmentPreview } = useGlobalContext()
  const {
    current_user: { currentUser: current_user },
  } = useAuth()

  const [formData, setFormData] = useState({
    plan_name: '',
    delivery_start: today,
    delivery_end: today,
    scope_all_branches: 'all',
    notes: '',
    status: 'planning',
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    fetchAssignmentPreview(formData)
    onCancel()
  }

  const formInputs = [
    {
      htmlFor: 'plan_name',
      label: 'Plan Name*',
      value: formData.plan_name,
      placeholder: 'e.g., New Plan',
      required: true,
    },
    {
      type: 'date',
      htmlFor: 'delivery_start',
      label: 'Delivery Start Date*',
      value: formData.delivery_start,
      required: true,
    },
    {
      type: 'date',
      htmlFor: 'delivery_end',
      label: 'Delivery End Date*',
      value: formData.delivery_end,
      required: true,
    },
    {
      type: 'select',
      htmlFor: 'scope_all_branches',
      label: 'Branch Scope*',
      value: formData.scope_all_branches,
      required: true,
      options: [
        { value: 'all', label: 'All Branches' },
        ...(branches?.data?.map((b) => ({
          value: b.id,
          label: b.name,
        })) || []),
      ],
    },
    {
      htmlFor: 'notes',
      label: 'Notes',
      value: formData.notes,
      placeholder: 'Plan notes',
    },
    {
      type: 'select',
      htmlFor: 'status',
      label: 'Status*',
      value: formData.status,
      required: true,
      options: [
        { value: 'planning', label: 'Planning' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
      ],
    },
  ]

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4  grid-cols-1">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg text-[#003e69]  font-bold tracking-tight uppercase">
              Create a New Plan
            </h2>
            <p className="text-[#428bca]">Enter plan details</p>
          </div>
        </div>
        <DetailCard
          title="Plan Details"
          description="Enter the plan information"
        >
          <DynamicInput
            inputs={formInputs}
            handleSelectChange={handleSelectChange}
            handleChange={handleChange}
          />
        </DetailCard>

        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-[#003e69]"
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={!formData.plan_name}
            className="bg-[#003e69] hover:bg-[#428bca]"
          >
            <Save className="mr-2 h-4 w-4" /> Commit
          </Button>
        </div>
      </div>
    </form>
  )
}

export default PlanCreationForm
