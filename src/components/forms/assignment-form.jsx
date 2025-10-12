import { useGlobalContext } from '@/context/global-context'
import { useAuth } from '@/context/initial-states/auth-state'
import { useState } from 'react'
import DetailCard from '../ui/detail-card'
import DynamicInput from '../ui/dynamic-input'
import { Separator } from '../ui/separator'
import { CardDescription, CardHeader, CardTitle } from '../ui/card'
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

const isoOr = (value, fallback) => {
  const s = (value ?? '').toString().trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : fallback
}

const { today, tomorrow, yesterday } = todayTomorrow()

const AssignmentForm = ({ id, onCancel }) => {
  const { branches, fetchAssignmentPreview } = useGlobalContext()
  const {
    current_user: { currentUser: current_user },
  } = useAuth()

  const [localFilters, setLocalFilters] = useState({
    departure_date: tomorrow, // default: tomorrow
    cutoff_date: today, // default: today
    branch_id: current_user?.branch_id,

    // customer_id: null,
    commit: false, // preview (no DB writes) if false
    notes: '',
    // routeAffinitySlop: 0.25,
    capacityHeadroom: 0.1,
    lengthBufferMm: 600,
    maxTrucksPerZone: 2,
    // ignoreLengthIfMissing: false,
    // ignoreDepartment: false,
    customerUnitCap: 2,
    // routeAffinitySlop: 0.25, // NEW
  })
  const [depOpen, setDepOpen] = useState(false)
  const [cutOpen, setCutOpen] = useState(false)

  // const buildNormalized = (commitFlag) => {
  //   const f = { ...localFilters }

  //   const depISO = isoOr(f.departure_date, tomorrow)
  //   const cutISO = isoOr(f.cutoff_date, depISO || today)

  //   // Accept array or single; drop "all"/empty
  //   let branch = f.branch_id
  //   if (!branch || (Array.isArray(branch) && branch.length === 0)) {
  //     branch = null
  //   } else if (!Array.isArray(branch)) {
  //     branch = branch === 'all' ? null : [branch]
  //   }

  //   return {
  //     ...localFilters,
  //     departure_date: depISO,
  //     cutoff_date: cutISO,
  //     branch_id: branch, // <-- array or null
  //     commit: !!commitFlag,
  //   }
  // }

  const buildNormalized = (commitFlag) => {
    const f = { ...localFilters }

    // Normalise dates:
    const depISO = isoOr(f.departure_date, tomorrow)
    const cutISO = isoOr(f.cutoff_date, depISO || today) // default to dep if not set; else today

    // Normalise branch: omit "all"
    const branch = f.branch_id && f.branch_id !== 'all' ? f.branch_id : ''

    // Normalize “all” to empty for API omission
    const normalized = {
      ...localFilters,
      departure_date: depISO,
      cutoff_date: cutISO,
      branch_id: branch,
      // branch_id: f.branch_id && f.branch_id !== 'all' ? f.branch_id : '',
      //scope_customer_name: f.scope_customer_name || '',
      // unit_type: f.unit_type && f.unit_type !== 'all' ? f.unit_type : '', // optional param
      commit: !!commitFlag,
    }
    return normalized
  }

  const handlePreview = () => {
    const params = buildNormalized(false)
    onPreview?.(params)
  }

  const handleCommit = () => {
    const params = buildNormalized(true)
    fetchAssignmentPreview(params)
    // console.log('params :>> ', params)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setLocalFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const params = buildNormalized(true)
    fetchAssignmentPreview(params)
    onCancel()
  }

  const assignment_filters = [
    {
      htmlFor: 'notes',
      label: 'Plan Name*',
      value: localFilters.notes,
      placeholder: 'e.g., Thursdays Plan',
      required: true,
    },

    {
      type: 'select',
      //multiple: true, // <--- new flag
      htmlFor: 'branch_id',
      label: 'Branch Name *',
      placeholder: 'Select branch',
      value: localFilters.branch_id,
      required: true,
      options: branches?.data?.map((b) => {
        return { value: b.id, label: b.name }
      }),
    },
    {
      type: 'date',
      htmlFor: 'cutoff_date',
      label: 'Cut off date',
      value: localFilters.cutoff_date,
      placeholder: 'Select date cut off date',
    },
    {
      type: 'date',
      htmlFor: 'departure_date',
      label: 'Departure date',
      value: localFilters.departure_date,
      placeholder: 'Select date of departure',
    },
  ]

  const vehicle_filters = [
    {
      type: 'number',
      htmlFor: 'capacityHeadroom',
      label: 'Capacity Head room',
      value: localFilters.capacityHeadroom,
      placeholder: 'Adjust the head room',
    },

    {
      type: 'number',
      htmlFor: 'lengthBufferMm',
      label: 'Length Buffer (mm)',
      value: localFilters.lengthBufferMm,
      placeholder: 'Adjust the length buffer',
    },
    {
      type: 'number',
      htmlFor: 'maxTrucksPerZone',
      label: 'Max truck Per Zone',
      value: localFilters.maxTrucksPerZone,
      placeholder: 'Adjust max per zone',
    },
    {
      type: 'number',
      htmlFor: 'customerUnitCap',
      label: 'Max trucks per Customer',
      value: localFilters.customerUnitCap,
      placeholder: 'Adjust the customer cap',
    },
  ]

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
        <DetailCard
          title="Assignment Filters"
          description="Use the filters below to refine your search"
        >
          <DynamicInput
            inputs={assignment_filters}
            handleSelectChange={handleSelectChange}
            handleChange={handleChange}
          />
          <Separator className={'my-6'} />
          <CardHeader className={'mb-4 pl-0'}>
            <CardTitle>Vehicle Filters</CardTitle>
            <CardDescription>Adjust vehicle settings</CardDescription>
          </CardHeader>
          <DynamicInput
            inputs={vehicle_filters}
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
            disabled={localFilters.notes == ''}
            className="bg-[#003e69] hover:bg-[#428bca]"
          >
            <Save className="mr-2 h-4 w-4" /> Commit
          </Button>
        </div>
      </div>
    </form>
  )
}

export default AssignmentForm
