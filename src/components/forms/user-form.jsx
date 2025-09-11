'use client'

// react
import { useState } from 'react'

// components
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// icons
import {
  Save,
  Users,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// context
import { useGlobalContext } from '@/context/global-context'
import DetailCard from '../ui/detail-card'
import DynamicInput from '../ui/dynamic-input'

// Function to get role badge for preview
const getRoleBadge = (role) => {
  switch (role) {
    case 'admin':
      return (
        <Badge className="bg-violet-500 hover:bg-violet-600">
          <ShieldCheck className="h-3 w-3 mr-1" /> Admin
        </Badge>
      )
    case 'manager':
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800"
        >
          <ShieldAlert className="h-3 w-3 mr-1" /> Manager
        </Badge>
      )
    case 'user':
      return (
        <Badge
          variant="outline"
          className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
        >
          <Users className="h-3 w-3 mr-1" /> User
        </Badge>
      )
    default:
      return <Badge>{role}</Badge>
  }
}

const UserForm = ({ onCancel, id }) => {
  const {
    users,
    upsertUser,
    users: { loading, error },
    usersDispatch,
    branches,
  } = useGlobalContext()
  const user = users.data.find((u) => u.id === id)
  //console.log('user :>> ', user)
  const [formData, setFormData] = useState({
    //  id: user?.id || '',
    name: user?.name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    role: user?.role || 'user',
    //costCentre: user?.costCentre || '',
    branch_id: user?.branch_id || '',
    status: user?.status || 'active',
    phone: user?.phone || '',
    department: user?.department || '',
    position: user?.position || '',
    join_date: user?.join_date || '',
    permissions: user?.permissions || [],
    managed_branches: user?.managed_branches || [],
  })
  const [currentTab, setCurrentTab] = useState(0)

  const tabs = [
    { name: 'User Information', value: 'basic' },
    { name: 'Permissions & Access', value: 'permissions' },
  ]

  const nextStep = (index) => {
    if (currentTab < tabs.length - 1) {
      setCurrentTab((prev) => prev + 1)
    }
  }

  const prevStep = (index) => {
    if (currentTab > 0) {
      setCurrentTab((prev) => prev - 1)
    }
  }

  // const paginationButtons = [
  //   {
  //     type: 'button',
  //     variant: 'outline',
  //     onClick: (index) => prevStep(index),
  //     name: 'Back',
  //   },
  //   {
  //     type: 'button',
  //     onClick: (index) => nextStep(index),
  //     name: 'Next',
  //   },
  // ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleBranchChange = (centre) => {
    setFormData((prev) => {
      const centres = [...prev.managed_branches]
      if (centres.includes(centre)) {
        return {
          ...prev,
          managed_branches: centres.filter((c) => c !== centre),
        }
      } else {
        return {
          ...prev,
          managed_branches: [...centres, centre],
        }
      }
    })
  }

  const availablePermissions = [
    { name: 'loads', access: 'none' },
    { name: 'users', access: 'none' },
    { name: 'orders', access: 'none' },
    { name: 'routes', access: 'none' },
    { name: 'drivers', access: 'none' },
    { name: 'branches', access: 'none' },
    { name: 'vehicles', access: 'none' },
    { name: 'customers', access: 'none' },
  ]

  const getPermissionAccess = (name) => {
    return formData?.permissions?.find((p) => p.name === name)?.access || ''
  }

  const handlePermissionChange = (name, access) => {
    setFormData((prev) => {
      const existing = prev.permissions.find((p) => p.name === name)
      let updatedPermissions

      if (existing) {
        if (existing.access === access) {
          // If same access clicked again, remove the permission
          updatedPermissions = prev.permissions.filter((p) => p.name !== name)
        } else {
          // Update access
          updatedPermissions = prev.permissions.map((p) =>
            p.name === name ? { ...p, access } : p
          )
        }
      } else {
        // Add new permission
        updatedPermissions = [...prev.permissions, { name, access }]
      }

      return {
        ...prev,
        permissions: updatedPermissions,
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setCurrentTab(0)
    //  console.log('formData :>> ', formData)
    upsertUser(id, formData, usersDispatch)
    onCancel()
  }

  // {

  //     "status": "active",

  //     "permissions": {
  //         "loads": "write",
  //         "users": "write",
  //         "orders": "write",
  //         "routes": "write",
  //         "drivers": "write",
  //         "branches": "write",
  //         "vehicles": "write",
  //         "customers": "write"
  //     },
  //     "managed_branches": [
  //         "dd6bc80f-d3ef-408d-9992-ee0da9b04355",
  //         "63abebd7-7a55-40de-a877-4ba021f8102a",
  //         "54335e52-2e9d-4942-a3a1-640ab7e5bf48"
  //     ],
  //     "recent_activities": [],
  //     "created_at": "2025-08-03T16:54:22.596034+00:00",
  //     "updated_at": "2025-08-03T16:54:22.596034+00:00",
  //     "branch_name": "Allied Steelrode (Pty) Ltd Head Office"
  // }

  const user_information = [
    {
      htmlFor: 'name',
      label: 'Name',
      value: formData.name,
      placeholder: 'e.g., Joe',
      required: true,
    },
    {
      htmlFor: 'last_name',
      label: 'Last Name',
      value: formData.last_name,
      placeholder: 'e.g., Soap',
      required: true,
    },
    {
      htmlFor: 'email',
      label: 'Email',
      value: formData.email,
      placeholder: 'e.g., example@Allied.co.za',
      required: true,
    },
    {
      htmlFor: 'phone',
      label: 'Phone',
      value: formData.phone,
      placeholder: 'e.g., +27 12 345 6789',
      required: true,
    },
    {
      htmlFor: 'department',
      label: 'Department',
      value: formData.department,
      placeholder: 'e.g., Operations',
      required: true,
    },
    {
      htmlFor: 'position',
      label: 'Position',
      value: formData.position,
      placeholder: 'e.g., Fleet Manager',
      required: true,
    },
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
      type: 'select',
      htmlFor: 'role',
      label: 'Role *',
      value: formData.role,
      placeholder: 'select user role',
      required: true,
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' },
        { value: 'manager', label: 'Manager' },
      ],
    },
    {
      type: 'date',
      htmlFor: 'join_date',
      label: 'Join Date',
      value: formData.join_date,
      placeholder: 'Select date of employment',
    },
    {
      type: 'select',
      htmlFor: 'status',
      label: 'Status',
      value: formData.status,
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ]
  //join_date

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4  grid-cols-1">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg text-[#003e69]  font-bold tracking-tight uppercase">
              {user?.id ? `Edit User` : 'Create User'}
            </h2>
            <p className="text-[#428bca]">
              {user?.id ? user.name : 'Enter user details'}
            </p>
          </div>
        </div>

        <Tabs
          value={tabs[currentTab]?.value}
          onValueChange={(value) => {
            const index = tabs.findIndex((tab) => tab.value === value)
            setCurrentTab(index)
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 gap-6">
            {tabs.map((tab, index) => (
              <TabsTrigger
                key={index}
                tabIndex={currentTab}
                value={tab.value}
                onClick={() => {
                  console.log('index :>> ', index)
                  setCurrentTab(index)
                }}
              >
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <DetailCard
              title={'User Information'}
              description={'Basic information about this user'}
            >
              <DynamicInput
                inputs={user_information}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />
            </DetailCard>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <DetailCard
              title={'Permissions'}
              description={'Set user permissions and access control'}
            >
              <div className="space-y-4">
                {/* Select All Buttons */}
                <div className="mb-4 flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updatedPermissions = availablePermissions.map(
                        (p) => ({ name: p.name, access: 'read' })
                      )
                      setFormData((prev) => ({
                        ...prev,
                        permissions: updatedPermissions,
                      }))
                    }}
                  >
                    Select All Read
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updatedPermissions = availablePermissions.map(
                        (p) => ({ name: p.name, access: 'write' })
                      )
                      setFormData((prev) => ({
                        ...prev,
                        permissions: updatedPermissions,
                      }))
                    }}
                  >
                    Select All Write
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, permissions: [] }))
                    }}
                  >
                    Clear All
                  </Button>
                </div>

                {/* Headers */}
                <div className="grid grid-cols-12 gap-2 mb-3 pb-2 border-b">
                  <h4 className="col-span-9 text-sm font-medium text-gray-500">
                    Permissions
                  </h4>
                  <div className="col-span-3 grid grid-cols-3 gap-2">
                    <span className="text-xs text-center font-medium text-gray-500">
                      View
                    </span>
                    <span className="text-xs text-center font-medium text-gray-500">
                      Edit
                    </span>
                    <span className="text-xs text-center font-medium text-gray-500">
                      None
                    </span>
                  </div>
                </div>

                {/* Permissions Grid */}
                <div className="space-y-3">
                  {availablePermissions.map((permission) => (
                    <div
                      key={permission.name}
                      className="grid grid-cols-12 gap-2 items-center py-2 hover:bg-gray-50 rounded-md px-2"
                    >
                      <div className="col-span-9">
                        <span className="capitalize text-sm font-medium">
                          {permission.name.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="col-span-3 grid grid-cols-3 gap-2">
                        {/* View (Read) */}
                        <div className="flex justify-center">
                          <Checkbox
                            checked={
                              getPermissionAccess(permission.name) === 'read'
                            }
                            onCheckedChange={() =>
                              handlePermissionChange(permission.name, 'read')
                            }
                          />
                        </div>

                        {/* Edit (Write) */}
                        <div className="flex justify-center">
                          <Checkbox
                            checked={
                              getPermissionAccess(permission.name) === 'write'
                            }
                            onCheckedChange={() =>
                              handlePermissionChange(permission.name, 'write')
                            }
                          />
                        </div>

                        {/* None */}
                        <div className="flex justify-center">
                          <Checkbox
                            checked={
                              getPermissionAccess(permission.name) === ''
                            }
                            onCheckedChange={() =>
                              handlePermissionChange(permission.name, '')
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className={'my-4'} />

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Managed Cost Centres
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {branches?.data?.map((centre) => {
                    return (
                      <div
                        key={centre.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={centre.id}
                          checked={formData?.managed_branches?.includes(
                            centre.id
                          )}
                          onCheckedChange={() => handleBranchChange(centre.id)}
                        />
                        <Label htmlFor={centre.id}>{centre.name}</Label>
                      </div>
                    )
                  })}
                </div>
              </div>
            </DetailCard>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="items-center space-x-2">
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
              className={currentTab == 1 ? 'shadow-none' : 'shadow'}
              disabled={currentTab == 1}
              onClick={nextStep}
            >
              <ChevronRight />
            </Button>
          </div>

          <Button
            type="submit"
            disabled={
              currentTab == 0 ||
              formData.name.length <= 3 ||
              formData.email.length < 6 ||
              !formData?.email?.includes('@') ||
              formData.permissions.length <= 0 ||
              formData.managed_branches.length <= 0
            }
          >
            <Save className="mr-2 h-4 w-4" /> Save User
          </Button>
        </div>
      </div>
    </form>
  )
}

export default UserForm
