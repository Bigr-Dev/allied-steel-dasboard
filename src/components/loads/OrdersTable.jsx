'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Eye, MoveRight } from 'lucide-react'
import { formatWeight, formatQty, formatDate } from '@/lib/formatters'
import ItemsSubTable from './ItemsSubTable'
import ReassignDialog from './ReassignDialog'

const getStatusBadgeVariant = (status) => {
  switch (status?.toLowerCase()) {
    case 'planned':
      return 'secondary'
    case 'assigned':
      return 'default'
    case 'loaded':
      return 'outline'
    case 'delivered':
      return 'default'
    case 'cancelled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export default function OrdersTable({
  orders,
  includeItems = false,
  showSuburb = false,
  onViewOrder,
  onReassignOrder,
}) {
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const toggleRowExpansion = (orderId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedRows(newExpanded)
  }

  const handleReassign = (order) => {
    setSelectedOrder(order)
    setReassignDialogOpen(true)
  }

  const handleReassignSuccess = () => {
    setReassignDialogOpen(false)
    setSelectedOrder(null)
    if (onReassignOrder) {
      onReassignOrder()
    }
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No orders found
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden border-[#003e69]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#003e69] hover:bg-[#428bca]">
              {includeItems && (
                <TableHead className="text-white w-12"></TableHead>
              )}
              <TableHead className="text-white">Customer</TableHead>
              <TableHead className="text-white">SO Number</TableHead>
              <TableHead className="text-white">Delivery Date</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white text-right">Qty</TableHead>
              <TableHead className="text-white text-right">Weight</TableHead>
              {showSuburb && (
                <TableHead className="text-white">Suburb</TableHead>
              )}
              <TableHead className="text-white text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const isExpanded = expandedRows.has(order.id)
              const hasItems =
                includeItems && order.load_items && order.load_items.length > 0

              return (
                <Collapsible key={order.id}>
                  <>
                    <TableRow className="cursor-pointer transition-colors hover:bg-muted/50">
                      {includeItems && (
                        <TableCell>
                          {hasItems ? (
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpansion(order.id)}
                                className="h-8 w-8 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          ) : (
                            <div className="w-8" />
                          )}
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        {order.customer_name}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {order.sales_order_number}
                        </code>
                      </TableCell>
                      <TableCell>{formatDate(order.delivery_date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(order.order_status)}
                        >
                          {order.order_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatQty(order.total_quantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatWeight(order.total_weight)}
                      </TableCell>
                      {showSuburb && <TableCell>{order.suburb_name}</TableCell>}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewOrder && onViewOrder(order)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReassign(order)}
                            className="h-8 w-8 p-0"
                          >
                            <MoveRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {includeItems && hasItems && (
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell
                            colSpan={showSuburb ? 9 : 8}
                            className="p-0"
                          >
                            <div className="bg-muted/30 p-4">
                              <ItemsSubTable items={order.load_items} />
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    )}
                  </>
                </Collapsible>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Reassign Dialog */}
      <ReassignDialog
        open={reassignDialogOpen}
        onOpenChange={setReassignDialogOpen}
        order={selectedOrder}
        onSuccess={handleReassignSuccess}
      />
    </>
  )
}
