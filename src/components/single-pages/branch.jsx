'use client'

// next

// components

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/ui/data-table'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

// icons
import { Users, Truck, Route } from 'lucide-react'

// context

import DisplayMap from '@/components/map/display-map'
import DetailActionBar from '@/components/layout/detail-action-bar'
import DetailCard from '@/components/ui/detail-card'
import { useGlobalContext } from '@/context/global-context'

export default function SingleBranch({ id }) {
  const { branches, users, vehicles, loads, dashboardState } =
    useGlobalContext()

  // Find the branch with the matching ID
  const branch = branches?.data?.find((cc) => cc.id === id) || {
    id: 'Not Found',
    name: 'branch Not Found',
    location: 'Unknown',
    manager: 'Unknown',
    users: 0,
    vehicles: 0,
    activeTrips: 0,
  }

  console.log('id :>> ', id)
  // Find users associated to this branch
  const userStats = users?.data?.filter(
    (u) => u.branch_id === dashboardState?.value
  )

  // Find vehicles associated with this branch
  const vehicleStats = vehicles?.data?.filter(
    (v) => v.branch_id === dashboardState?.value
  )

  // Find vehicles associated with this branch
  const loadStats = loads?.data?.filter(
    (l) => l.branch_id === dashboardState?.value
  )
  // console.log('trips :>> ', loadStats)

  // Column definitions for users table
  const userColumns = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'role',
      header: 'Role',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'department',
      header: 'Department',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.getValue('status') === 'active' ? 'success' : 'secondary'
          }
        >
          {row.getValue('status')}
        </Badge>
      ),
    },
  ]

  // Column definitions for vehicles table
  const vehicleColumns = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'type',
      header: 'Type',
    },
    {
      accessorKey: 'model',
      header: 'Model',
    },
    {
      accessorKey: 'regNumber',
      header: 'Reg Number',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status')
        let badgeClass = ''

        switch (status) {
          case 'in-use':
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-200'
            break
          case 'available':
            badgeClass = 'bg-green-100 text-green-800 border-green-200'
            break
          case 'maintenance':
            badgeClass = 'bg-amber-100 text-amber-800 border-amber-200'
            break
          default:
            badgeClass = 'bg-gray-100 text-gray-800 border-gray-200'
        }

        return (
          <Badge variant="outline" className={badgeClass}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'lastService',
      header: 'Last Service',
    },
  ]

  // Column definitions for trips table
  const tripColumns = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'driver',
      header: 'Driver',
    },
    {
      accessorKey: 'vehicle',
      header: 'Vehicle',
    },
    {
      accessorKey: 'departure',
      header: 'Departure',
    },
    {
      accessorKey: 'destination',
      header: 'Destination',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status')
        let badgeClass = ''

        switch (status) {
          case 'in-progress':
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-200'
            break
          case 'scheduled':
            badgeClass = 'bg-gray-100 text-gray-800 border-gray-200'
            break
          case 'completed':
            badgeClass = 'bg-green-100 text-green-800 border-green-200'
            break
          default:
            badgeClass = 'bg-gray-100 text-gray-800 border-gray-200'
        }

        return (
          <Badge variant="outline" className={badgeClass}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'progress',
      header: 'Progress',
      cell: ({ row }) => (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className={`h-2.5 rounded-full ${
                row.original.status === 'completed'
                  ? 'bg-green-500'
                  : row.original.status === 'in-progress'
                  ? 'bg-blue-500'
                  : 'bg-gray-500'
              }`}
              style={{ width: `${row.getValue('progress')}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500">
            {row.getValue('progress')}%
          </span>
        </div>
      ),
    },
  ]

  const branch_info = [
    {
      label: 'ID',
      value: branch.id,
    },
    {
      label: 'Name',
      value: branch.name,
    },
    {
      label: 'Manager',
      value: branch.manager,
    },
    {
      label: 'Manager Email',
      value: branch.managerEmail || 'N/A',
    },
    {
      label: 'Manager Phone',
      value: branch.managerPhone || 'N/A',
    },
    // {
    //   label: 'Address',
    //   value: branch.address || 'N/A',
    // },
    {
      label: 'Street',
      value: branch.street || 'N/A',
    },
    {
      label: 'City',
      value: branch.city || 'N/A',
    },
    {
      label: 'State',
      value: branch.state || 'N/A',
    },
    {
      label: 'Country',
      value: branch.country || 'N/A',
    },
    {
      label: 'Status',
      value: (
        <Badge variant={branch.status === 'active' ? 'success' : 'secondary'}>
          {branch.status || 'active'}
        </Badge>
      ),
    },
    {
      label: 'Established',
      value: branch.established || 'N/A',
    },
    {
      label: 'Budget',
      value: branch.budget || 'N/A',
    },
  ]
  // console.log('userStats :>> ', userStats)
  // console.log('branch :>> ', branch)
  return (
    <div className="space-y-6">
      <DetailActionBar id={id} title={branch.name} />

      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard
          title={'branch Information'}
          description={'Detailed information about this branch'}
        >
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {branch_info.map((info) => (
              <div key={info.label}>
                <dt className="text-sm font-medium text-gray-500">
                  {info.label}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{info.value}</dd>
              </div>
            ))}
          </dl>

          <Separator className="my-4" />

          <div>
            <h4 className="text-sm font-medium text-gray-500">Description</h4>
            <p className="mt-1 text-sm text-gray-900">
              {branch.description || 'No description available.'}
            </p>
          </div>
        </DetailCard>

        <DetailCard
          title={'branch overview'}
          description={'Overview of resources in this branch'}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-lg bg-blue-50 p-4 dark:bg-blue-900">
              <Users className="h-8 w-8 text-blue-500 dark:text-blue-300" />
              <h3 className="mt-2 text-xl font-bold">{userStats.length}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Users</p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-orange-50 p-4 dark:bg-orange-900">
              <Truck className="h-8 w-8 text-orange-500 dark:text-orange-300" />
              <h3 className="mt-2 text-xl font-bold">{vehicleStats.length}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vehicles
              </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-green-50 p-4 dark:bg-green-900">
              <Route className="h-8 w-8 text-green-500 dark:text-green-300" />
              <h3 className="mt-2 text-xl font-bold">{loadStats.length}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loads</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="mt-6">
            <label className="text-sm font-medium text-gray-500">
              Location
            </label>
            <div className="mt-2 h-[200px] rounded-lg bg-gray-100 flex items-center justify-center">
              <DisplayMap
                coords={branch.coords}
                street={branch.street}
                city={branch.city}
                state={branch.state}
                country={branch.country}
              />
            </div>
          </div>
        </DetailCard>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-3 gap-6">
          <TabsTrigger value="users">{`Users (${
            userStats?.length || 0
          })`}</TabsTrigger>
          <TabsTrigger value="vehicles">{`Vehicles (${
            vehicleStats?.length || 0
          })`}</TabsTrigger>
          <TabsTrigger value="loads">{`Loads (${
            loadStats?.length || 0
          })`}</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users in {branch.name}</CardTitle>
              <CardDescription>
                All users assigned to this branch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={userColumns}
                data={userStats}
                filterColumn="name"
                filterPlaceholder="Search users..."
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicles in {branch.name}</CardTitle>
              <CardDescription>
                All vehicles assigned to this branch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={vehicleColumns}
                data={vehicleStats}
                filterColumn="model"
                filterPlaceholder="Search vehicles..."
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="loads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loads for {branch.name}</CardTitle>
              <CardDescription>
                All loads associated with this branch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={tripColumns}
                data={loadStats}
                filterColumn="id"
                filterPlaceholder="Search branches..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
