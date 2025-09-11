'use client'
// components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useGlobalContext } from '@/context/global-context'
import { replaceHyphenWithUnderscore } from '@/hooks/replace-hyphen'
import { useToast } from '@/hooks/use-toast'
import { usePathname } from 'next/navigation'

const AlertScreen = ({ alertOpen, setAlertOpen, id }) => {
  const pathname = usePathname().slice(1)
  const screen = replaceHyphenWithUnderscore(pathname)
  const { toast } = useToast()

  //       orders,
  //       ordersDispatch,
  //       deleteOrder,

  const {
    deleteBranch,
    branchesDispatch,
    deleteCustomer,
    customersDispatch,
    deleteUser,
    usersDispatch,
    deleteVehicle,
    vehiclesDispatch,
    deleteDriver,
    driversDispatch,
    deleteRoute,
    routesDispatch,
    deleteLoad,
    loadsDispatch,
  } = useGlobalContext()
  let deleteItem = null
  let dispatch = null

  switch (screen) {
    case 'branches':
      deleteItem = deleteBranch
      dispatch = branchesDispatch
      break

    case 'customers':
      deleteItem = deleteCustomer
      dispatch = customersDispatch
      break

    case 'users':
      deleteItem = deleteUser
      dispatch = usersDispatch
      break

    case 'vehicles':
      deleteItem = deleteVehicle
      dispatch = vehiclesDispatch
      break

    case 'drivers':
      deleteItem = deleteDriver
      dispatch = driversDispatch
      break

    case 'routes':
      deleteItem = deleteRoute
      dispatch = routesDispatch
      break

    case 'loads':
      deleteItem = deleteLoad
      dispatch = loadsDispatch
      break

    default:
      deleteItem = null
      break
  }

  const handleDelete = async () => {
    const readableScreen = pathname?.replace(/-/g, ' ')

    if (!deleteItem || !dispatch) {
      toast({
        title: 'Error deleting item',
        description: 'This item cannot be deleted from this screen.',
      })
      return
    }

    try {
      await deleteItem(id, dispatch)
      toast({
        title: `${readableScreen} ${id} was deleted successfully`,
      })
    } catch (error) {
      toast({
        title: `Error deleting ${readableScreen} ${id}`,
        description: error?.message,
      })
    }
  }

  return (
    <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to remove item with id {id} from {screen} data This
            action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AlertScreen
