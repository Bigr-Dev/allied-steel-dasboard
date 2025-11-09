'use client'

// next
import { usePathname } from 'next/navigation'

// components
import DriverForm from '@/components/forms/driver-form'
import StopPointForm from '@/components/forms/stop-point-form'
import TripForm from '@/components/forms/trip-form'
import UserForm from '@/components/forms/user-form'
import VehicleForm from '@/components/forms/vehicle-form'
import BranchForm from '@/components/forms/branch-form'
import CustomerForm from '@/components/forms/customer-form'

// shadcn
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

// hooks
import { replaceHyphenWithUnderscore } from '@/hooks/replace-hyphen'
import AssignmentForm from '../forms/assignment-form'
import DashboardForm from '../forms/dashboard-form'
import { useGlobalContext } from '@/context/global-context'
import PlanCreationForm from '../forms/plan-creation-form'

const DialogScreen = ({ open, onOpenChange, id, href }) => {
  const { selectedVehicle, vehicles } = useGlobalContext()
  const currentPath = usePathname()
  const pathname = href ? href : currentPath.split('/')[1]
  const screen = replaceHyphenWithUnderscore(pathname)
  const vehiclesData = vehicles?.data
  // console.log('href :>> ', href)
  // console.log('screen :>> ', usePathname())
  // console.log('vehiclesData :>> ', vehiclesData)
  const Modal = ({ children }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle></DialogTitle>
        <DialogDescription></DialogDescription>
      </DialogHeader>

      <DialogContent className="min-w-[60%] h-[90vh]  overflow-y-scroll pt-10 border-r-2 ">
        {children}
      </DialogContent>
    </Dialog>
  )
  // console.log('screen :>> ', screen)

  switch (screen) {
    case 'dashboard':
      return (
        <Modal>
          <DashboardForm
            screen={screen}
            id={id}
            open={open}
            onCancel={() => onOpenChange()}
          />
        </Modal>
      )

    case 'branches':
      return (
        <Modal>
          <BranchForm
            screen={screen}
            id={id}
            open={open}
            onCancel={() => onOpenChange()}
          />
        </Modal>
      )

    case 'customers':
      return (
        <Modal>
          <CustomerForm
            screen={screen}
            id={id}
            open={open}
            onCancel={() => onOpenChange()}
          />
        </Modal>
      )

    case 'users':
      return (
        <Modal>
          <UserForm
            screen={screen}
            id={id}
            open={open}
            onCancel={() => onOpenChange()}
          />
        </Modal>
      )

    case 'vehicles':
      return (
        <Modal>
          <VehicleForm
            screen={screen}
            id={id}
            open={open}
            onCancel={() => onOpenChange()}
          />
        </Modal>
      )

    case 'drivers':
      return (
        <Modal>
          <DriverForm
            screen={screen}
            id={id}
            open={open}
            onCancel={() => onOpenChange()}
          />
        </Modal>
      )

    case 'stop_points':
      return (
        <Modal>
          <StopPointForm
            screen={screen}
            id={id}
            open={open}
            onCancel={() => onOpenChange()}
          />
        </Modal>
      )

    case 'load_assignment':
      if (pathname == 'load-assignment' && currentPath.split('/')[2]) {
        return (
          <Modal>
            <AssignmentForm
              screen={screen}
              id={id}
              open={open}
              onCancel={() => onOpenChange()}
            />
          </Modal>
        )
      } else {
        return (
          <Modal>
            <PlanCreationForm
              screen={screen}
              id={id}
              open={open}
              onCancel={() => onOpenChange()}
            />
          </Modal>
        )
      }

    default:
      // If we have selectedVehicle data, show the dashboard form
      if (selectedVehicle) {
        return (
          <Modal>
            <DashboardForm
              screen="dashboard"
              id={id}
              open={open}
              onCancel={() => onOpenChange()}
            />
          </Modal>
        )
      }
      return (
        <Modal>
          <DialogDescription>Dialog form space</DialogDescription>
        </Modal>
      )
  }
}
export default DialogScreen
