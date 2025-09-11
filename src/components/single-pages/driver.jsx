'use client'

// context
import { useGlobalContext } from '@/context/global-context'

// components
import Loading from '../ui/loading'
import DetailActionBar from '../layout/detail-action-bar'
import DetailCard from '../ui/detail-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { DataTable } from '../ui/data-table'

const SingleDriver = ({ id }) => {
  const {
    onEdit,
    onDelete,
    drivers: { data },
    // loads: { data: loads_data },
  } = useGlobalContext()
  const driver = data?.find((d) => d.id === id)

  //   {
  //     "id": "2ef35afc-5882-406b-9de2-605d50067c79",
  //     "branch_id": "dd6bc80f-d3ef-408d-9992-ee0da9b04355",

  //     "id_doctype": "ID",

  //     "license_type": "SA",

  //     "license_code": null,
  //     "license_expiry": "2029-05-07",
  //     "attach_license_front": null,
  //     "attach_license_back": null,
  //     "professional_permit": true,
  //     "attach_professional_permit": null,

  //     "current_trip_id": null,
  //     "current_trip": null,
  //     "last_trip_id": null,
  //     "date_of_birth": null,
  //     "medical_exam_expiry": null,
  //     "hire_date": null,
  //     "certifications": null,
  //     "driving_record": null,
  //     "recent_trips": null,
  //     "created_at": null,
  //     "updated_at": null,

  // }

  const tabs = [
    {
      value: 'trips',
      title: `Recent Trips`,
      description: `History of recent trips by ${driver?.name}`,
      // columns: tripColumns,
      // data: driver.recentTrips || [],
      // filterColumn: 'id',
      // filterPlaceholder: 'Search trips...',
    },
    {
      value: 'driving-record',
      title: `Driving Record`,
      description: `Driver's safety record and violations`,
      // columns: vehicleColumns,
      // data: vehicleStats,
      // filterColumn: 'model',
      // filterPlaceholder: 'Search vehicles...',
    },
    {
      value: 'emergency-contact',
      title: `Emergency Contact`,
      description: 'Emergency contact information',
      // columns: tripColumns,
      // data: tripStats,
      // filterColumn: 'id',
      // filterPlaceholder: 'Search trips...',
    },
  ]

  const driver_information = [
    { label: 'Name', value: driver?.name || 'NA' },
    { label: 'Last Name', value: driver?.last_name || 'NA' },
    { label: 'Phone', value: driver?.phone || 'NA' },
    { label: 'Email', value: driver?.email || 'NA' },
    { label: 'Emergency Contact', value: driver?.emergency_contact || 'NA' },
    { label: 'Emergency Phone', value: driver?.emergency_phone || 'NA' },

    { label: 'Date of Birth', value: driver?.date_of_birth || 'NA' },
    { label: 'Identity Number', value: driver?.identity_number || 'NA' },

    // { label: 'Attach License Front', value: driver?.attach_license_front },
    // { label: 'Attach License Back', value: driver?.attach_license_back },

    { label: 'Address', value: driver?.address || 'NA' },
    { label: 'City', value: driver?.city || 'NA' },
  ]
  const driver_status = [
    { label: 'Branch', value: driver?.branch_name },
    { label: 'Status', value: driver?.status },
    { label: 'License', value: driver?.license },
    { label: 'License Expiry', value: driver?.license_expiry },
    {
      label: 'Professional Permit',
      value: driver?.professional_permit ? 'True' : 'False',
    },
    // {
    //   label: 'Attach Professional Permit',
    //   value: driver?.attach_professional_permit,
    // },
    { label: 'Permit Expiry Date', value: driver?.permit_expiry_date },
    { label: 'Vehicle Assignment', value: driver?.assigned_to || 'NA' },
    { label: 'Current Vehicle', value: driver?.current_vehicle || 'NA' },
    {
      label: 'Medical exam Expiry',
      value: driver?.medical_exam_expiry || 'Not Recorded',
    },
  ]
  const driver_trips = [
    { label: 'Trips', value: driver?.trips },
    { label: 'Loads', value: driver?.loads },
    { label: 'Revenue', value: driver?.revenue },
    { label: 'Distance', value: driver?.distance },
  ]

  // const driver_record=[

  //     "accidents": 0,
  //     "violations": 0,
  //     "lastReviewDate": ""

  // ]

  const tripColumns = [
    {
      accessorKey: 'id',
      header: 'Trip ID',
    },
    {
      accessorKey: 'route',
      header: 'Route',
    },
    {
      accessorKey: 'date',
      header: 'Date',
    },
    {
      accessorKey: 'distance',
      header: 'Distance',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.getValue('status') === 'completed' ? 'success' : 'secondary'
          }
        >
          {row.getValue('status')}
        </Badge>
      ),
    },
  ]

  //console.log('driver :SingleDriver>> ', driver)
  return (
    <div>
      {data ? (
        <div className="space-y-6">
          <DetailActionBar
            id={id}
            title={driver?.name}
            description={driver?.phone}
          />
          {/* Driver Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <DetailCard
              title={'Driver Information'}
              description={'Detailed information about this driver'}
            >
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {driver_information.map((info) => (
                  <div key={info.label}>
                    <dt className="text-sm font-medium text-gray-500">
                      {info.label}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{info.value}</dd>
                  </div>
                ))}
              </dl>
            </DetailCard>
            <DetailCard
              title={'Driver Status'}
              description={'Current driver status'}
            >
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {driver_status.map((info) => (
                  <div key={info.label}>
                    <dt className="text-sm font-medium text-gray-500">
                      {info.label}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{info.value}</dd>
                  </div>
                ))}
              </dl>
            </DetailCard>
          </div>
          <Tabs defaultValue="trips">
            <TabsList className="grid w-full grid-cols-3 gap-6">
              {tabs.map((trigger, id) => (
                <TabsTrigger key={id} value={trigger.value}>
                  <h6 className="capitalize">
                    {trigger.value}
                    {trigger?.data ? `(${trigger?.data?.length || '0'})` : null}
                  </h6>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="trips" className="space-y-4">
              <DetailCard
                title={'Recent Trips'}
                description={`History of recent trips by ${
                  driver?.name || 'this driver'
                }`}
              >
                <DataTable
                  columns={tripColumns}
                  data={driver?.recentTrips || []}
                  url="none"
                  filterColumn="id"
                  filterPlaceholder="Search trips..."
                />
              </DetailCard>
            </TabsContent>
            <TabsContent value="driving-record" className="space-y-4">
              <DetailCard
                title={'Driving Record'}
                description={"Driver's safety record and violations"}
              >
                {driver?.driving_record ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                      <h3 className="text-sm text-gray-500">Violations</h3>
                      <p className="text-2xl font-bold">
                        {driver?.driving_record?.violations}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                      <h3 className="text-sm text-gray-500">Accidents</h3>
                      <p className="text-2xl font-bold">
                        {driver?.driving_record?.accidents}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                      <h3 className="text-sm text-gray-500">Last Review</h3>
                      <p className="text-lg font-medium">
                        {driver?.driving_record?.lastReviewDate}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No driving record available</p>
                )}
              </DetailCard>
            </TabsContent>
            <TabsContent value="emergency-contact" className="space-y-4">
              <DetailCard
                title={'Emergency Contact'}
                description={'Emergency contact information'}
              >
                {driver?.emergency_contact ? (
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Name
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {driver.emergencyContact}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Phone
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {driver.emergency_phone}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-gray-500">
                    No emergency contact information available
                  </p>
                )}
              </DetailCard>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Loading />
      )}
    </div>
  )
}

export default SingleDriver

{
  /* <div>
{data ? ( 
) : (
        <Loading />
      )}
    </div>
*/
}
