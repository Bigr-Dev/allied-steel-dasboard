'use client'

import { ArrowLeft, Download, Edit } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

// components
import { Button } from '@/components/ui/button'

// context

// hooks
import { getPermittedAccessRoutes } from '@/hooks/get-accessible-routes'
import { useAuth } from '@/context/initial-states/auth-state'
import { useGlobalContext } from '@/context/global-context'
import { fetchData } from '@/lib/fetch'
import { useState } from 'react'
import { Spinner } from '../ui/spinner'

const DetailActionBar = ({ id, title, description }) => {
  const pathname = usePathname().split('/')[1]

  const router = useRouter()
  const {
    current_user: {
      currentUser: { permissions },
    },
  } = useAuth()
  const {
    onEdit,
    routes,
    // assignment: { data: assignment },
    assignment_preview: assignment,
  } = useGlobalContext()
  // console.log('assignment_preview :>> ', assignment_preview)
  const accessibleRoutes = getPermittedAccessRoutes(permissions, routes)

  const canEdit = accessibleRoutes.filter((p) => p.href.includes(pathname))
  const [loading, setLoading] = useState(false)

  // const downloadPlan = async () => {
  //   setLoading(true)
  //   try {
  //     // const res = await fetch('/plans/export-load-plan', {
  //     //   method: 'GET',
  //     //   cache: 'no-store',
  //     // })
  //     // if (!res.ok) {
  //     //   const txt = await res.text().catch(() => '')
  //     //   throw new Error(txt || `HTTP ${res.status}`)
  //     // }
  //     // const blob = await res.blob()
  //     const res = await fetch('/api/plans/export-load-plan', {
  //       method: 'GET',
  //       cache: 'no-store',
  //     })
  //     if (!res.ok) {
  //       const txt = await res.text().catch(() => '')
  //       throw new Error(txt || `HTTP ${res.status}`)
  //     }
  //     const blob = await res.blob()
  //     const ab = await blob.arrayBuffer()
  //     const sig = new Uint8Array(ab).slice(0, 2)
  //     if (!(sig[0] === 0x50 && sig[1] === 0x4b)) {
  //       // Not a ZIP/XLSX – show first chars of the payload to debug
  //       const text = new TextDecoder().decode(new Uint8Array(ab).slice(0, 200))
  //       throw new Error('Server did not return an XLSX.\nPreview: ' + text)
  //     }
  //     const cd = res.headers.get('Content-Disposition') || ''
  //     const m = cd.match(/filename="([^"]+)"/i)
  //     const filename = m?.[1] || 'load-plan.xlsx'

  //     const url = URL.createObjectURL(blob)
  //     const a = document.createElement('a')
  //     a.href = url
  //     a.download = filename
  //     document.body.appendChild(a)
  //     a.click()
  //     a.remove()
  //     URL.revokeObjectURL(url)
  //     setLoading(false)
  //   } catch (error) {
  //     setLoading(false)
  //     console.log('download error:', error)
  //     alert(error.message || 'Export failed')
  //   }
  // }

  // inside DetailActionBar.jsx
  const downloadPlan = async () => {
    setLoading(true)
    try {
      // you have the assignment object in scope—pass it:
      const res = await fetch('/api/plans/export-load-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment), // <-- send it
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `HTTP ${res.status}`)
      }

      const blob = await res.blob()
      // sanity check: XLSX starts with ZIP magic "PK"
      const ab = await blob.arrayBuffer()
      const sig = new Uint8Array(ab).slice(0, 2)
      if (!(sig[0] === 0x50 && sig[1] === 0x4b)) {
        const text = new TextDecoder().decode(new Uint8Array(ab).slice(0, 200))
        throw new Error('Server did not return an XLSX.\nPreview: ' + text)
      }

      const cd = res.headers.get('Content-Disposition') || ''
      const m = cd.match(/filename="([^"]+)"/i)
      const filename = m?.[1] || 'load-plan.xlsx'

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log('download error:', error)
      alert(error.message || 'Export failed')
    }
  }

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
        {pathname == 'load-assignment' && usePathname().split('/')[2] ? (
          <Button
            // variant="outline"
            onClick={downloadPlan}
            disabled={canEdit[0]?.access !== 'write'}
            className={'bg-[#003e69] hover:bg-[#428bca] text-white capitalize'}
          >
            {loading ? <Spinner /> : <Download className="mr-2 h-4 w-4" />}
            {pathname == 'load-assignment' && usePathname().split('/')[3]
              ? 'Download Vehicle Plan'
              : pathname == 'load-assignment' && usePathname().split('/')[2]
              ? 'Download Full Plan'
              : ` Edit ${pathname}`}
          </Button>
        ) : (
          <Button
            // variant="outline"
            onClick={() => onEdit({ id })}
            disabled={canEdit[0]?.access !== 'write'}
            className={'bg-[#003e69] hover:bg-[#428bca] text-white capitalize'}
          >
            <Edit className="mr-2 h-4 w-4" />
            {` Edit ${pathname}`}
          </Button>
        )}
      </div>
    </div>
  )
}

export default DetailActionBar
