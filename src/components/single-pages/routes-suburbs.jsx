'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, MapPin, Clock, Package, Route } from 'lucide-react'
import { useGlobalContext } from '@/context/global-context'
import DetailActionBar from '../layout/detail-action-bar'
import CountUp from '../ui/count-up'
import DetailCard from '../ui/detail-card'
import { Separator } from '../ui/separator'
import { createSortableHeader, DataTable } from '../ui/data-table'

export default function RoutesPage({ id }) {
  const { routes } = useGlobalContext()

  const routesData = routes?.data?.find((o) => o.id == id)

  console.log('routesData :>> ', routesData)

  // const totalWeight = routesData?.order_lines?.reduce(
  //   (sum, line) => sum + line.weight * line.quantity,
  //   0
  // )
  // const totalItems = routesData?.order_lines.reduce(
  //   (sum, line) => sum + line.quantity,
  //   0
  // )

  const screenStats = [
    {
      title: 'Total Suburbs',
      value: routesData?.route_suburbs?.length || 0,
      icon: <Package className="h-5 w-5 text-violet-500" />,
    },
    // {
    //   title: 'Total Weight',
    //   value: `${totalWeight?.toFixed(1)} kg` || '0 kg',
    //   icon: <Package className="h-5 w-5 text-pink-700" />,
    // },
    // {
    //   title: 'Due Date',
    //   value:
    //     new Date(routesData?.document_due_date).toLocaleDateString() || 'N/A',
    //   icon: <Clock className="h-5 w-5 text-orange-500" />,
    // },
    // {
    //   title: 'Route',
    //   value: routesData?.sales_order_route || 'N/A',
    //   icon: <Route className="h-5 w-5 text-emerald-500" />,
    // },
  ]

  // const order_information = [
  //   {
  //     label: 'Sales Person',
  //     value: routesData?.sales_person_name,
  //   },
  //   {
  //     label: 'Customer Reference',
  //     value: routesData?.customer_reference_number,
  //   },
  //   {
  //     label: 'Card Code',
  //     value: routesData?.card_code,
  //   },
  //   {
  //     label: 'Zone',
  //     value: routesData?.sales_order_zone,
  //   },
  //   {
  //     label: 'Created Date',
  //     value: new Date(routesData?.created_at).toLocaleDateString(),
  //   },
  //   {
  //     label: ' Dispatch Status',
  //     value: (
  //       <Badge
  //         variant={
  //           routesData?.send_to_dispatch === 'Y' ? 'default' : 'secondary'
  //         }
  //       >
  //         {routesData?.send_to_dispatch === 'Y'
  //           ? 'Ready for Dispatch'
  //           : 'Not Ready'}
  //       </Badge>
  //     ),
  //   },
  // ]

  // const customer_information = [
  //   //  { label: 'Company Name', value: routesData?.customer_name },
  //   {
  //     label: 'Address',
  //     value: (
  //       <div className="text-sm">
  //         <p>{routesData?.street_on_customer_record}</p>
  //         <p>{routesData?.block_on_customer_record}</p>
  //         <p>{routesData?.city_on_customer_record}</p>
  //         <p>{routesData?.zip_code_on_customer_record}</p>
  //       </div>
  //     ),
  //   },
  //   {
  //     label: 'Business Hours',
  //     value: (
  //       <div className="text-sm">
  //         <p>
  //           Mon-Thu: {routesData?.customer_opening_time_monday_to_friday} -{' '}
  //           {routesData?.customer_closing_time_monday_to_thursday}
  //         </p>
  //         <p>
  //           Friday: {routesData?.customer_opening_time_monday_to_friday} -{' '}
  //           {routesData?.customer_closing_time_friday}
  //         </p>
  //       </div>
  //     ),
  //   },
  // ]

  const order_columns = [
    {
      accessorKey: 'province',
      header: createSortableHeader('Province'),
    },
    {
      accessorKey: 'city',
      header: createSortableHeader('City'),
    },
    {
      accessorKey: 'suburb_name',
      header: createSortableHeader('Suburb Name'),
    },
    {
      accessorKey: 'description',
      header: createSortableHeader('Description'),
    },

    {
      accessorKey: 'position',
      header: createSortableHeader('Total Weight (kg)'),
      cell: ({ row }) => row.getValue('position'),
    },
  ]

  return (
    <div className=" space-y-6">
      <DetailActionBar
        id={id}
        title={`Route Details`}
        description={`${routesData?.name} | ${routesData?.description} `}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {screenStats?.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center h-full justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] lg:text-[16px] font-bold ">
                {stat.title}
              </CardTitle>
              <div>{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] lg:text-[16px] font-semibold  ">
                {typeof stat.value == 'number' ? (
                  <CountUp value={stat.value} />
                ) : (
                  stat.value
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Information */}
        {/* <DetailCard
          title={'Order Information'}
          description={'Information about this order'}
        >
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {order_information?.map((info) => (
              <div key={info.label}>
                <dt className="text-sm font-medium text-gray-500">
                  {info.label}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{info.value}</dd>
              </div>
            ))}
          </dl>
        </DetailCard> */}

        {/* Customer Information */}
        {/* <DetailCard
          title={'Customer Details'}
          description={routesData?.customer_name}
        >
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {customer_information?.map((info) => (
              <div key={info.label}>
                <dt className="text-sm font-medium text-gray-500">
                  {info.label}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{info.value}</dd>
              </div>
            ))}
          </dl>
          <Separator className={'my-6'} />
        </DetailCard> */}
      </div>

      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"></div> */}

      {/* Order Lines Table */}
      <DetailCard title={'Order Lines'}>
        {routesData?.route_suburbs && (
          <DataTable
            columns={order_columns}
            data={routesData?.route_suburbs}
            filterColumn="model"
            filterPlaceholder="Search vehicles..."
          />
        )}
      </DetailCard>

      {/* Actions */}
      {/* <div className="flex justify-end space-x-4">
        <Button variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          View in System
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700">Process Order</Button>
      </div> */}
    </div>
  )
}
