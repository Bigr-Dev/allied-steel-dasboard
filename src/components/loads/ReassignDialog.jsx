'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useReassignOrder } from '@/hooks/loads/useReassignOrder'
import { MoveRight, AlertCircle } from 'lucide-react'

export default function ReassignDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}) {
  const [loadStopId, setLoadStopId] = useState('')
  const [enforceSameBranch, setEnforceSameBranch] = useState(true)
  const [enforceSameRoute, setEnforceSameRoute] = useState(false)
  const [error, setError] = useState('')

  const { loading, reassign } = useReassignOrder()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!loadStopId.trim()) {
      setError('Load stop ID is required')
      return
    }

    if (!order?.id) {
      setError('Order ID is missing')
      return
    }

    setError('')

    try {
      await reassign(order.id, {
        load_stop_id: loadStopId.trim(),
        enforce_same_branch: enforceSameBranch,
        enforce_same_route: enforceSameRoute,
      })

      // Reset form
      setLoadStopId('')
      setEnforceSameBranch(true)
      setEnforceSameRoute(false)
      setError('')

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      // Error is already handled by the hook and shown via toast
      console.error('Reassign error:', err)
    }
  }

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      // Reset form when closing
      setLoadStopId('')
      setEnforceSameBranch(true)
      setEnforceSameRoute(false)
      setError('')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MoveRight className="h-5 w-5" />
            Reassign Order
          </DialogTitle>
          <DialogDescription>
            Move order {order?.sales_order_number} to a different load stop.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loadStopId">Target Load Stop ID</Label>
            <Input
              id="loadStopId"
              placeholder="Enter load stop ID..."
              value={loadStopId}
              onChange={(e) => setLoadStopId(e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enforceSameBranch">Enforce Same Branch</Label>
                <p className="text-sm text-muted-foreground">
                  Ensure the target load stop is in the same branch
                </p>
              </div>
              <Switch
                id="enforceSameBranch"
                checked={enforceSameBranch}
                onCheckedChange={setEnforceSameBranch}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enforceSameRoute">Enforce Same Route</Label>
                <p className="text-sm text-muted-foreground">
                  Ensure the target load stop is on the same route
                </p>
              </div>
              <Switch
                id="enforceSameRoute"
                checked={enforceSameRoute}
                onCheckedChange={setEnforceSameRoute}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !loadStopId.trim()}
              className="bg-[#003e69] hover:bg-[#428bca]"
            >
              {loading ? 'Moving...' : 'Move Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
