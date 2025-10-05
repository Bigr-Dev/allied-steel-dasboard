'use client'

import { ArrowLeft, Edit } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

// components
import { Button } from '@/components/ui/button'

// context

// hooks
import { getPermittedAccessRoutes } from '@/hooks/get-accessible-routes'
import { useAuth } from '@/context/initial-states/auth-state'
import { useGlobalContext } from '@/context/global-context'

const DetailActionBar = ({ id, title, description }) => {
  const pathname = usePathname().split('/')[1]

  // console.log('pathname :>> ', pathname)
  const router = useRouter()
  const {
    current_user: {
      currentUser: { permissions },
    },
  } = useAuth()
  const { onEdit, routes } = useGlobalContext()

  const accessibleRoutes = getPermittedAccessRoutes(permissions, routes)

  const canEdit = accessibleRoutes.filter((p) => p.href.includes(pathname))
  //  console.log('canEdit :>> ', canEdit[0]?.access !== 'write')
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
      <div className="flex items-center gap-4 ">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl text-[#003e69]  font-bold tracking-tight capitalize">
            {title ? title : id}
          </h2>
          <p className="text-[#428bca]">{description || null}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          // variant="outline"
          onClick={() => onEdit({ id })}
          disabled={canEdit[0]?.access !== 'write'}
          className={'bg-[#003e69] hover:bg-[#428bca] text-white capitalize'}
        >
          <Edit className="mr-2 h-4 w-4" />
          {` Edit ${pathname}`}
        </Button>
      </div>
    </div>
  )
}

export default DetailActionBar
