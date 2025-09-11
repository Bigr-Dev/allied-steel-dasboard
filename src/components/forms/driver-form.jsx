// react
import { useState } from 'react'

// context
import { useGlobalContext } from '@/context/global-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import DetailCard from '../ui/detail-card'
import DynamicInput from '../ui/dynamic-input'
import { Separator } from '../ui/separator'
import { CardDescription, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'

const test_data = {
  id: 'a5df1c37-f71f-4803-be72-7134e1b602a0',
  branch_id: '54335e52-2e9d-4942-a3a1-640ab7e5bf48',
  name: 'NDISHENI LEONARD',
  last_name: 'NDAO',
  id_doctype: 'ID',
  identity_number: '6202055362087',
  phone: '078 4901995',
  email: null,
  emergency_contact: null,
  emergency_phone: null,
  license_type: 'SA',
  license: null,
  license_code: null,
  license_expiry: null,
  attach_license_front: null,
  attach_license_back: null,
  professional_permit: false,
  attach_professional_permit: null,
  permit_expiry_date: null,
  status: 'available',
  assigned_to: null,
  current_trip_id: null,
  current_trip: null,
  last_trip_id: null,
  date_of_birth: null,
  medical_exam_expiry: null,
  hire_date: null,
  certifications: null,
  driving_record: null,
  recent_trips: null,
  created_at: null,
  updated_at: null,
  current_vehicle: null,
  branch_name: 'Allied Steelrode (Pty) Ltd Midvaal',
}

const DriverForm = ({ id, onCancel }) => {
  const {
    branches,
    drivers,
    vehicles,
    driversDispatch,
    upsertDriver,
    setModalOpen,
  } = useGlobalContext()
  const driver = drivers?.data.find((c) => c.id === id)

  const [formData, setFormData] = useState({
    // id: driver?.id || '',
    branch_id: driver?.branch_id || '',
    // branch_name: driver?.branch_name || '',
    name: driver?.name || '',
    last_name: driver?.last_name || '',
    id_doctype: driver?.id_doctype || '',
    identity_number: driver?.identity_number || '',
    // date_of_birth: driver?.date_of_birth || '',
    phone: driver?.phone || '',
    email: driver?.email || '',
    emergency_contact: driver?.emergency_contact || '',
    emergency_phone: driver?.emergency_phone || '',
    status: driver?.status || 'available',
    // assigned_to: driver?.assigned_to || '',
    current_vehicle: driver?.current_vehicle || '',

    license_type: driver?.license_type || '',
    license: driver?.license || '',
    license_code: driver?.license_code || '',
    license_expiry: driver?.license_expiry || '',
    attach_license_front: driver?.attach_license_front || '',
    attach_license_back: driver?.attach_license_back || '',
    professional_permit: driver?.professional_permit || false,
    attach_professional_permit: driver?.attach_professional_permit || null,
    permit_expiry_date: driver?.permit_expiry_date || '',
    // medical_exam_expiry: driver?.medical_exam_expiry || '',
    // hire_date: driver?.hire_date || '',
    certifications: driver?.certifications || null,
  })

  const tabs = [
    { name: 'Driver Information', value: 'driver_info' },
    { name: 'License Information', value: 'license_info' },
    { name: 'Vehicle Assignment', value: 'status' },
  ]
  console.log(
    'vehicles :>> ',
    vehicles?.data?.filter((v) => v.type == 'Del Vehicle')
  )
  const driver_details = [
    {
      type: 'select',
      htmlFor: 'branch_id',
      label: 'Branch Name *',
      placeholder: 'Select branch',
      value: formData.branch_id,
      required: true,
      options: branches?.data?.map((b) => {
        return { value: b.id, label: b.name }
      }),
    },
    {
      htmlFor: 'name',
      label: 'Name *',
      value: formData.name,
      placeholder: 'e.g., John',
      required: true,
    },
    {
      htmlFor: 'last_name',
      label: 'Last Name *',
      value: formData.last_name,
      placeholder: 'e.g., Smith',
      required: true,
    },
    {
      type: 'select',
      htmlFor: 'id_doctype',
      label: 'ID Type *',
      placeholder: 'Select ID type',
      value: formData.id_doctype,
      required: true,
      readOnly: false,
      options: [
        { value: 'ID', label: 'South African ID' },
        { value: 'Passport', label: 'International Passport' },
      ],
    },
    {
      htmlFor: 'identity_number',
      label:
        formData.id_doctype === 'ID'
          ? 'Identification Number *'
          : 'Passport Number *',
      value: formData.identity_number,
      placeholder:
        formData.id_doctype === 'ID'
          ? 'e.g., 8501015009087'
          : 'e.g., A12345678',
      required: true,
    },
    {
      htmlFor: 'phone',
      label: 'Contact Number *',
      value: formData.phone,
      placeholder: '+27 82 123 4567',
      required: true,
    },
    {
      htmlFor: 'email',
      label: 'Email Address *',
      value: formData.email,
      placeholder: 'john.smith@email.com',
      required: true,
    },
    {
      htmlFor: 'emergency_contact',
      label: 'Emergency Contact *',
      value: formData.emergency_contact,
      placeholder: 'e.g., Jane Smith',
      required: true,
    },
    {
      htmlFor: 'emergency_phone',
      label: 'Emergency Contact Number *',
      value: formData.emergency_phone,
      placeholder: '+27 82 987 6543',
      required: true,
    },
    {
      type: 'select',
      htmlFor: 'current_vehicle',
      label: 'Vehicle Assignment *',
      value: formData.current_vehicle,
      placeholder: 'Select a vehicle',
      required: true,
      options: vehicles?.data
        ?.filter((v) => v.type == 'Del Vehicle')
        ?.map((v) => {
          return { value: v.id, label: v.license_plate }
        }),
    },
  ]

  const license_details = [
    {
      type: 'select',
      htmlFor: 'license_type',
      label: 'Country of Issue *',
      placeholder: 'Select local/international',
      value: formData.license_type,
      required: true,
      readOnly: false,
      options: [
        { value: 'SA', label: 'South African' },
        { value: 'International', label: 'International' },
      ],
    },
    {
      htmlFor: 'license',
      label: 'Drivers License Number *',
      value: formData.license,
      placeholder: 'e.g., 1234567890123',
      required: true,
    },
    {
      htmlFor: 'license_code',
      label: 'License Code *',
      value: formData.license_code,
      placeholder: 'e.g., C1',
      required: true,
    },
    {
      htmlFor: 'license_expiry',
      label: 'License Expiry Date *',
      type: 'date',
      value: formData.license_expiry,
      placeholder: 'Select expiry date',
      required: true,
    },
    // {
    //   htmlFor: 'driverRestrictionCode',
    //   label: 'Driver Restrictions *',
    //   value: formData.driverRestrictionCode,
    //   placeholder: 'e.g., A - Corrective lenses',
    //   required: true,
    // },
    // {
    //   htmlFor: 'vehicleRestrictionCode',
    //   label: 'Vehicle restrictions *',
    //   value: formData.vehicleRestrictionCode,
    //   placeholder: 'e.g., Automatic transmission only',
    //   required: true,
    // },
  ]

  const documents = [
    {
      htmlFor: 'attach_license_front',
      label: 'Drivers License (Front)',
      type: 'file',
      value: formData.attach_license_front,
      required: true,
    },
    {
      htmlFor: 'attach_license_back',
      label: 'Drivers License (Back)',
      type: 'file',
      value: formData.attach_license_back,
      required: true,
    },
    {
      type: 'select',
      htmlFor: 'professional_permit',
      label: 'Special Permits',
      placeholder: 'Indicate if any special permits',
      value: formData.professional_permit,
      required: true,
      readOnly: false,
      options: [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' },
      ],
    },
    {
      htmlFor: 'permit_expiry_date',
      label: 'Permit Expiry Date',
      type: 'date',
      value: formData.permit_expiry_date,
      required: true,
      readOnly: formData.professional_permit === false,
    },
  ]

  const nextStep = () => {
    if (currentTab < 2) {
      const next = currentTab + 1
      setCurrentTab(next)
    }
  }

  const prevStep = () => {
    if (currentTab > 0) {
      const prev = currentTab - 1
      setCurrentTab(prev)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('driving_record.')) {
      const key = name.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        drivingRecord: {
          ...prev.drivingRecord,
          [key]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const dataToSubmit = {
      ...formData,
      certifications: formData?.certifications
        ?.split(',')
        ?.map((s) => s.trim())
        ?.filter((s) => s !== ''),
    }
    console.log('dataToSubmit :>> ', dataToSubmit)
    upsertDriver(id, dataToSubmit, driversDispatch)

    onCancel()
  }
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4  grid-cols-1">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg text-[#003e69]  font-bold tracking-tight uppercase">
              {driver?.id ? `Edit Driver` : 'Add New Driver'}
            </h2>
            <p className="text-[#428bca]">
              {driver?.id ? driver.name : 'Enter Driver Details'}
            </p>
          </div>
        </div>

        <Tabs defaultValue={tabs[0]?.value} className="w-full">
          <TabsList className={`grid w-full grid-cols-${tabs.length} gap-6`}>
            {tabs.map((tab, index) => (
              <TabsTrigger key={index} value={tab.value}>
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="driver_info" className="space-y-4">
            <DetailCard
              title={'Driver Information'}
              description={'Enter the details for this driver'}
            >
              <DynamicInput
                inputs={driver_details}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />
            </DetailCard>
          </TabsContent>

          <TabsContent value="license_info" className="space-y-4">
            <DetailCard
              title={'Driver License Information'}
              description={'Enter Driver License information'}
            >
              <DynamicInput
                inputs={license_details}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />
              <Separator className="my-4 space-y-1" />

              <div className="mb-6">
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Upload Driver documents</CardDescription>
              </div>
              <DynamicInput
                inputs={documents}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />
            </DetailCard>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2 ">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className={'min-w-[120px]'}
          >
            Cancel
          </Button>
          {/* <div className="items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              className={currentTab == 0 ? 'shadow-none' : 'shadow'}
              disabled={currentTab == 0}
              onClick={prevStep}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              type="button"
              className={currentTab == 2 ? 'shadow-none' : 'shadow'}
              disabled={currentTab == 2}
              onClick={nextStep}
            >
              <ChevronRight />
            </Button>
          </div> */}
          <Button
            type="submit"
            // disabled={currentTab !== 2}
            className={'min-w-[120px]'}
          >
            <Save className="mr-2 h-4 w-4" /> Save Driver
          </Button>
        </div>
      </div>
    </form>
  )
}

export default DriverForm
