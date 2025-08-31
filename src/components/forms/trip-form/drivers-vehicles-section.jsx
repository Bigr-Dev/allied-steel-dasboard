'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Users, Truck } from 'lucide-react'
import DetailCard from '@/components/ui/detail-card'
import { useAuth } from '@/context/initial-states/auth-state'
import { useGlobalContext } from '@/context/global-context'

export function DriversVehiclesSection({
  formData,
  handleVehicleDriverChange,
  addVehicleDriver,
  removeVehicleDriver,
  handleVehicleTrailerChange,
  addVehicleTrailer,
  removeVehicleTrailer,
  handleVehicleChange,
  addVehicle,
  removeVehicle,
  drivers,
  vehicles,
  t,
}) {
  const { current_user } = useAuth()
  const { cost_centres } = useGlobalContext()

  // console.log('current_user', current_user?.currentUser?.costCentre)
  const selectedCostCentre =
    cost_centres?.data.find((c) => c.id === formData.costCentre)?.name ||
    current_user?.currentUser?.costCentre

  const horses = vehicles?.data.filter(
    (v) => v.type === 'Vehicle' && v.costCentre === selectedCostCentre
  )
  const trailers = vehicles?.data.filter(
    (v) => v.type === 'Trailer' && v.costCentre === selectedCostCentre
  )
  const available_drivers = drivers?.data?.filter(
    (d) => d.status === 'available' && d.costCentre === selectedCostCentre
  )

  const available_vehicles = horses?.filter((v) => v.status === 'available')

  const available_trailers = trailers?.filter((t) => t.status === 'available')

  return (
    <div className="space-y-6">
      <DetailCard
        title={'Vehicles, Drivers & Trailers'}
        description={
          'Assign vehicles with their drivers and trailers to this trip'
        }
      >
        {formData.vehicleAssignments.map((vehicleAssignment, vehicleIndex) => (
          <Card key={`vehicle-${vehicleIndex}`} className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  <CardTitle className="text-lg">
                    {vehicleIndex === 0
                      ? 'Primary Vehicle'
                      : `Vehicle ${vehicleIndex + 1}`}
                  </CardTitle>
                </div>
                {formData.vehicleAssignments.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVehicle(vehicleIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vehicle Selection */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`vehicle-${vehicleIndex}`}>
                    Select Vehicle
                  </Label>
                  <Select
                    value={vehicleAssignment.vehicle.id}
                    onValueChange={(value) =>
                      handleVehicleChange(vehicleIndex, value)
                    }
                  >
                    <SelectTrigger
                      id={`vehicle-${vehicleIndex}`}
                      className="w-full border-[#d3d3d3]"
                    >
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {available_vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.model} ({v.regNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />

              {/* Drivers Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <Label className="text-base font-medium">
                    Drivers for this Vehicle
                  </Label>
                </div>

                {vehicleAssignment.drivers.map((driver, driverIndex) => (
                  <div
                    key={`vehicle-${vehicleIndex}-driver-${driverIndex}`}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="px-2 py-1">
                        {driverIndex === 0
                          ? 'Primary Driver'
                          : `Driver ${driverIndex + 1}`}
                      </Badge>
                      {vehicleAssignment.drivers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeVehicleDriver(vehicleIndex, driverIndex)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Select
                        value={driver.id}
                        onValueChange={(value) =>
                          handleVehicleDriverChange(
                            vehicleIndex,
                            driverIndex,
                            value
                          )
                        }
                      >
                        <SelectTrigger className="w-full border-[#d3d3d3]">
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {available_drivers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} - {d.license}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addVehicleDriver(vehicleIndex)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Driver to this Vehicle
                </Button>
              </div>

              <Separator />

              {/* Trailers Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  <Label className="text-base font-medium">
                    Trailers for this Vehicle
                  </Label>
                </div>

                {vehicleAssignment.trailers.map((trailer, trailerIndex) => (
                  <div
                    key={`vehicle-${vehicleIndex}-trailer-${trailerIndex}`}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="px-2 py-1">
                        Trailer {trailerIndex + 1}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeVehicleTrailer(vehicleIndex, trailerIndex)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Select
                      value={trailer.id}
                      onValueChange={(value) =>
                        handleVehicleTrailerChange(
                          vehicleIndex,
                          trailerIndex,
                          value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trailer" />
                      </SelectTrigger>
                      <SelectContent>
                        {available_trailers.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.model} ({t.regNumber}) - {t.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addVehicleTrailer(vehicleIndex)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Trailer to this Vehicle
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addVehicle}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Another Vehicle
        </Button>
      </DetailCard>
    </div>
  )
}

// 'use client'

// import { Label } from '@/components/ui/label'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
// import { Separator } from '@/components/ui/separator'
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card'
// import { Plus, Trash2 } from 'lucide-react'
// import DetailCard from '@/components/detail-pages/detail-page-components/detail-card'

// export function DriversVehiclesSection({
//   formData,
//   handleDriverChange,
//   addDriver,
//   removeDriver,
//   handleVehicleChange,
//   addVehicle,
//   removeVehicle,
//   drivers,
//   vehicles,
// }) {
//   const available_drivers = drivers?.data?.filter(
//     (d) => d.status == 'available'
//   )

//   const available_vehicles = vehicles?.data?.filter(
//     (v) => v.status == 'available'
//   )
//   // console.log('drivers :>> ', available_drivers)
//   return (
//     <div className="space-y-6">
//       <DetailCard title={'Drivers'} description={'Assign drivers to this trip'}>
//         {formData.drivers.map((driver, index) => (
//           <div key={`driver-${index}`} className="space-y-4">
//             <div className="flex items-center justify-between">
//               <Badge variant="outline" className="px-2 py-1">
//                 {index === 0 ? 'Primary Driver' : `Secondary Driver ${index}`}
//               </Badge>
//               {formData.drivers.length > 1 && (
//                 <Button
//                   type="button"
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => removeDriver(index)}
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </Button>
//               )}
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor={`driver-${index}`}>Select Driver</Label>
//               <Select
//                 value={driver.id}
//                 onValueChange={(value) => handleDriverChange(index, value)}
//               >
//                 <SelectTrigger id={`driver-${index}`}>
//                   <SelectValue placeholder="Select driver" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {available_drivers.map((d) => (
//                     <SelectItem key={d.id} value={d.id}>
//                       {d.name} - {d.license}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             {index < formData.drivers.length - 1 && (
//               <Separator className="my-4" />
//             )}
//           </div>
//         ))}

//         <Button
//           type="button"
//           variant="outline"
//           className="w-full"
//           onClick={addDriver}
//         >
//           <Plus className="h-4 w-4 mr-2" /> Add Another Driver
//         </Button>
//       </DetailCard>

//       <DetailCard
//         title={'Vehicles'}
//         description={'Assign vehicles to this trip'}
//       >
//         {formData.vehicles.map((vehicle, index) => (
//           <div key={`vehicle-${index}`} className="space-y-4">
//             <div className="flex items-center justify-between">
//               <Badge variant="outline" className="px-2 py-1">
//                 {index === 0
//                   ? 'Primary Vehicle'
//                   : `Additional Vehicle ${index}`}
//               </Badge>
//               {formData.vehicles.length > 1 && (
//                 <Button
//                   type="button"
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => removeVehicle(index)}
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </Button>
//               )}
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor={`vehicle-${index}`}>Select Vehicle</Label>
//               <Select
//                 value={vehicle.id}
//                 onValueChange={(value) => handleVehicleChange(index, value)}
//               >
//                 <SelectTrigger id={`vehicle-${index}`}>
//                   <SelectValue placeholder="Select vehicle" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {available_vehicles.map((v) => (
//                     <SelectItem key={v.id} value={v.id}>
//                       {v.model} ({v.regNumber})
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             {index < formData.vehicles.length - 1 && (
//               <Separator className="my-4" />
//             )}
//           </div>
//         ))}

//         <Button
//           type="button"
//           variant="outline"
//           className="w-full"
//           onClick={addVehicle}
//         >
//           <Plus className="h-4 w-4 mr-2" /> Add Another Vehicle
//         </Button>
//       </DetailCard>
//     </div>
//   )
// }
