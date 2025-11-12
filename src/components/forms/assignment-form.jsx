import { useGlobalContext } from '@/context/global-context'
import { useAuth } from '@/context/initial-states/auth-state'
import { useState } from 'react'
import DetailCard from '../ui/detail-card'
import DynamicInput from '../ui/dynamic-input'
import { Button } from '../ui/button'
import { Plus, Save } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

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

const AssignmentForm = ({ id, onCancel }) => {
  const {
    branches,
    fetchAssignmentPreview,
    assignment_preview,
    runAutoAssign,
    vehicles,
  } = useGlobalContext()
  // console.log('assignment_preview :>> ', assignment_preview)
  const {
    current_user: { currentUser: current_user },
  } = useAuth()
  //console.log('assignment_preview :>> ', assignment_preview)
  const assignmentData = {
    plan_id: assignment_preview?.plan?.id || null,
    branch_id: 'all',
    commit: true,
    max_units_per_customer_per_day: 2,
  }
  const vehicleData = {
    plan_id: assignment_preview?.plan?.id || null,

    vehicle_assignment_id: null,
    notes: '',
  }
  const unassignedVehicles = assignment_preview?.unused_units || []
  // console.log('unassignedVehicles :>> ', unassignedVehicles)
  const [formData, setFormData] = useState(assignmentData)

  const tabs = [
    { name: 'Auto assign', value: 'auto-assign' },
    { name: 'Add Vehicle', value: 'add-vehicle' },
  ]
  const [currentTab, setCurrentTab] = useState(tabs[0].value)

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
    // fetchAssignmentPreview(formData)
    if (currentTab === 'auto-assign') {
      runAutoAssign(formData)
    } else {
      // addVehicle(formData)
      console.log('formData :>> ', formData)
    }
    // console.log('currentTab :>> ', currentTab)

    onCancel()
  }

  const assignmentInputs = [
    {
      type: 'select',
      htmlFor: 'branch_id',
      label: 'Branch Scope*',
      value: formData.branch_id,
      required: true,
      options: [
        { value: 'all', label: 'All Branches' },
        ...(unassignedVehicles?.map((v) => ({
          value: v.vehicle_assignment_id,
          label: `v.name`,
        })) || []),
      ],
    },
    // {
    //   htmlFor: 'notes',
    //   label: 'Notes',
    //   value: formData.notes,
    //   placeholder: 'Plan notes',
    // },
    // {
    //   type: 'select',
    //   htmlFor: 'status',
    //   label: 'Status*',
    //   value: formData.status,
    //   required: true,
    //   options: [
    //     { value: 'planning', label: 'Planning' },
    //     { value: 'active', label: 'Active' },
    //     { value: 'completed', label: 'Completed' },
    //   ],
    // },
  ]

  const vehicleInputs = [
    {
      type: 'select',
      htmlFor: 'vehicle_assignment_id',
      label: 'Vehicle*',
      value: formData.vehicle_assignment_id,
      required: true,
      options: [
        { value: 'all', label: 'All Branches' },
        ...(branches?.data?.map((b) => ({
          value: b.id,
          label: b.name,
        })) || []),
      ],
    },
  ]

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4  grid-cols-1">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg text-[#003e69]  font-bold tracking-tight uppercase">
              Vehicle Assignment
            </h2>
            <p className="text-[#428bca]">
              Auto assign vehicles and orders or manual assign vehicles to the
              plan
            </p>
          </div>
        </div>
        <Tabs defaultValue={tabs[0]?.value} className="w-full">
          <TabsList className={`grid w-full grid-cols-${tabs.length} gap-6`}>
            {tabs.map((tab, index) => (
              <TabsTrigger
                key={index}
                value={tab.value}
                onClick={() => {
                  console.log('index :>> ', index)
                  if (index === 0) {
                    setFormData(assignmentData)
                  } else {
                    setFormData(vehicleData)
                  }
                  setCurrentTab(tab.value)
                }}
              >
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="auto-assign">
            <DetailCard
              title="Plan Details"
              description="Enter the plan information"
            >
              {currentTab === 'auto-assign' && (
                <DynamicInput
                  inputs={assignmentInputs}
                  handleSelectChange={handleSelectChange}
                  handleChange={handleChange}
                />
              )}
            </DetailCard>
          </TabsContent>
          <TabsContent value="add-vehicle">
            <DetailCard
              title="Plan Details"
              description="Enter the plan information"
            >
              {currentTab === 'add-vehicle' && (
                <DynamicInput
                  inputs={vehicleInputs}
                  handleSelectChange={handleSelectChange}
                  handleChange={handleChange}
                />
              )}
            </DetailCard>
          </TabsContent>
        </Tabs>
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
            disabled={
              currentTab === 'auto-assign'
                ? false
                : !vehicleData.vehicle_assignment_id
            }
            className="bg-[#003e69] hover:bg-[#428bca]"
          >
            {currentTab === 'auto-assign' ? (
              <>
                <Save className="mr-2 h-4 w-4" /> Auto Assign
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Add Vehicle
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default AssignmentForm
