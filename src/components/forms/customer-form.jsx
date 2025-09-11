'use client'

// react
import { useEffect, useState } from 'react'

// icons
import { ArrowLeft, Save, Plus, Trash2, MapPin } from 'lucide-react'

// context
import { useGlobalContext } from '@/context/global-context'

//components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import DetailCard from '../ui/detail-card'
import AddressAutocomplete from '../ui/address-autocomplete'
import DynamicInput from '../ui/dynamic-input'

const CustomerForm = ({ id, onCancel }) => {
  const { customers, customersDispatch, upsertCustomer, setModalOpen } =
    useGlobalContext()
  const customer = customers?.data.find((c) => c.id === id)
  console.log('customers :>> ', customer)
  const [formData, setFormData] = useState({
    // id: customer?.id || '',
    bp_code: customer?.bp_code || '', //done
    customer_name: customer?.customer_name || '', //done
    card_code: customer?.card_code || '', //done

    contact_person: customer?.contact_person || '', //done
    email: customer?.email || '', //done
    phone: customer?.phone || '', //done
    // ck_number: customer?.ck_number || '',
    // vat_number: customer?.vat_number || '',
    // industry: customer?.industry || '',
    mon_fri_open: customer?.mon_fri_open || '',
    mon_thurs_closed: customer?.mon_thurs_closed || '',
    fri_closed: customer?.fri_closed || '',
    sat_delivery_yes: customer?.sat_delivery_yes || null,
    sat_delivery_no: customer?.sat_delivery_no || null,

    address_name: customer?.address_name || '',
    street: customer?.street || '', //done
    block: customer?.block || '',
    city: customer?.city || '', // done
    // state: customer?.state || '', //done
    country: customer?.country || '', //done
    zip_code: customer?.zip_code || '',
    postcode: customer?.postcode || '',
    coords: customer?.coords || '', //done
    address_type: customer?.address_type || '',
    route: customer?.route || '', //done
    zone: customer?.zone || '', //done
    // fullAddress: `${customer?.street || ''}, ${customer?.city || ''}, ${
    //   customer?.state || ''
    // }, ${customer?.country || ''}`,
    // row_number: customer?.row_number || '',

    vehicle_requirements: customer?.vehicle_requirements || 'Any Vehicle', //done
    dispatch_remarks: customer?.dispatch_remarks || '',
    remarks: customer?.remarks || '',
  })

  const customer_information = [
    {
      htmlFor: 'bp_code',
      label: 'Bp Code',
      value: formData.bp_code,
      required: false,
      // readOnly: true,
    },
    {
      htmlFor: 'customer_name',
      label: 'Company Name *',
      value: formData.customer_name,
      placeholder: 'ABC Manufacturing',
      required: true,
    },
    {
      htmlFor: 'card_code',
      label: 'Card code',
      value: formData.card_code,
      placeholder: 'customer card code',
      required: false,
    },
    // {
    //   htmlFor: 'ckNumber',
    //   label: 'Registration Number',
    //   value: formData.ckNumber,
    //   placeholder: '2025/40476/1234',
    //   required: false,
    // },
    // {
    //   htmlFor: 'taxNumber',
    //   label: 'Tax Number',
    //   value: formData.taxNumber,
    //   placeholder: 'ABN 12 345 678 901',
    //   required: false,
    // },
    // {
    //   htmlFor: 'vatNumber',
    //   label: 'Vat Number',
    //   value: formData.vatNumber,
    //   placeholder: '456787654',
    //   required: false,
    // },
    // {
    //   type: 'select',
    //   options: [
    //     { value: 'active', label: 'Active' },
    //     { value: 'inactive', label: 'Inactive' },
    //     { value: 'Suspended', label: 'Suspended' },
    //   ],
    //   htmlFor: 'status',
    //   label: 'Status',
    //   value: formData.status,
    //   placeholder: 'Active',
    //   required: false,
    // },
  ]

  const contact_details = [
    {
      htmlFor: 'contact_person',
      label: 'Contact Person *',
      value: formData.contact_person,
      placeholder: 'John Smith',
      required: true,
    },
    {
      htmlFor: 'email',
      label: 'Email *',
      value: formData.email,
      placeholder: 'contact@company.com',
      required: true,
    },
    {
      htmlFor: 'phone',
      label: 'Phone *',
      value: formData.phone,
      placeholder: '+61 2 9876 5432',
      required: true,
    },
  ]

  const customer_address = [
    {
      htmlFor: 'street',
      label: 'Street *',
      value: formData.street,
      placeholder: 'e.g., 123 Business Park',
      required: true,
    },
    {
      htmlFor: 'city',
      label: 'City *',
      value: formData.city,
      placeholder: 'e.g., Johannesburg',
      required: true,
    },
    {
      htmlFor: 'state',
      label: 'Province *',
      value: formData.state,
      placeholder: 'e.g., Gauteng',
      required: true,
    },
    {
      htmlFor: 'country',
      label: 'Country *',
      value: formData.country,
      placeholder: 'e.g., South Africa',
      required: true,
    },
    {
      htmlFor: 'latitude',
      label: 'Latitude',
      value: formData.coords?.lat || '',
      placeholder: 'e.g., -26.2041',
      required: false,
      readOnly: true,
    },
    {
      htmlFor: 'longitude',
      label: 'Longitude',
      value: formData.coords?.lng || '',
      placeholder: 'e.g., 28.0473',
      required: false,
      readOnly: true,
    },

    {
      htmlFor: 'route',
      label: 'Route',
      value: formData.route || '',
      placeholder: 'e.g., 28.0473',
      required: true,
    },

    {
      htmlFor: 'zone',
      label: 'Zone',
      value: formData.zone || '',
      placeholder: 'e.g., 28.0473',
      required: false,
    },
  ]

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

  // const handleAddressSelect = (components) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     street: components.street || prev.street,
  //     city: components.city || prev.city,
  //     state: components.state || prev.state,
  //     country: components.country || prev.country,
  //     fullAddress: components.formatted_address || prev.fullAddress,
  //   }))
  // }

  // const handleCoordinatesChange = (coords) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     coords,
  //   }))
  // }

  const handleSubmit = (e) => {
    e.preventDefault()
    // console.log('formData :>> ', formData)
    upsertCustomer(id, formData, customersDispatch)
    setModalOpen()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4  grid-cols-1">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg text-[#003e69]  font-bold tracking-tight uppercase">
              {customer?.id ? `Edit Customer` : 'Create New Customer'}
            </h2>
            <p className="text-[#428bca]">
              {customer?.id
                ? customer?.customer_name
                : 'Enter New Customer Details'}
            </p>
          </div>
        </div>

        <DetailCard
          title="Customer Information"
          description="Enter the details for this customer"
        >
          <DynamicInput
            inputs={customer_information}
            handleSelectChange={handleSelectChange}
            handleChange={handleChange}
          />

          <Separator className="my-4 space-y-1" />

          <div className="mb-6">
            <CardTitle>Contact Details</CardTitle>
            <CardDescription>
              Enter Customer Contact Details & OPerating Hours
            </CardDescription>
          </div>

          <DynamicInput
            inputs={contact_details}
            handleSelectChange={handleSelectChange}
            handleChange={handleChange}
          />

          <Separator className="my-4 space-y-1" />

          <div className="mb-6">
            <CardTitle>Location</CardTitle>
            <CardDescription>Enter Customer Location</CardDescription>
          </div>

          {/* Address Autocomplete */}
          {/* <div className="mb-4">
            <AddressAutocomplete
              label="Search Address"
              value={formData?.fullAddress}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, fullAddress: val }))
              }
              onAddressSelect={handleAddressSelect}
              onCoordinatesChange={handleCoordinatesChange}
              placeholder="Start typing an address..."
            />
          </div> */}

          <DynamicInput
            inputs={customer_address}
            handleSelectChange={handleSelectChange}
            handleChange={handleChange}
          />

          <Separator className="my-4 space-y-1" />

          <div className="mb-6">
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              Enter Customer Specific Information
            </CardDescription>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_requirements">Vehicle Requirements</Label>
            <Textarea
              id="vehicle_requirements"
              name="vehicle_requirements"
              value={formData.vehicle_requirements}
              onChange={handleChange}
              placeholder="Enter any vehicle requirements"
              rows={4}
            />
          </div>

          <div className="space-y-2 my-4">
            <Label htmlFor="dispatch_remarks">Dispatch Remarks</Label>
            <Textarea
              id="dispatch_remarks"
              name="dispatch_remarks"
              value={formData.dispatch_remarks}
              onChange={handleChange}
              placeholder="Enter any dispatch remarks"
              rows={4}
            />
          </div>
        </DetailCard>

        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            className={'border-[#003e69] hover:border-[#428bca]'}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" className={'bg-[#003e69] hover:bg-[#428bca]'}>
            <Save className="mr-2 h-4 w-4" /> Save Customer
          </Button>
        </div>
      </div>
    </form>
  )
}

export default CustomerForm
