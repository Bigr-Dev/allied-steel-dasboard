'use client'

import { useDraggable } from '@dnd-kit/core'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { GripVertical, MapPin, Route, Building2 } from 'lucide-react'
import { memo } from 'react'

export const DraggableItemRow = memo(function DraggableItemRow({
  item,
  customer,
  containerId,
  isDraggable = false,
  isUnassigned = false,
}) {
  const weight = isUnassigned ? item.weight_left : item.assigned_weight_kg

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.item_id,
      disabled: !isDraggable,
      data: {
        containerId: containerId || (isUnassigned ? 'unassigned' : null),
        item_id: item.item_id,
        assignment_id: item.assignment_id || null,
        order_id: item.order_id || null,
        customer_name: customer?.customer_name || item.customer_name,
        route_name: customer?.route_name || item.route_name,
        suburb_name: customer?.suburb_name || item.suburb_name,
        weight: weight,
        description: item.description,
      },
    })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        willChange: 'transform',
      }
    : undefined

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200 ${
          isDraggable
            ? 'cursor-grab active:cursor-grabbing hover:shadow-md'
            : ''
        } ${isDragging ? 'opacity-50 rotate-3 shadow-lg scale-105 z-50' : ''}`}
        {...listeners}
        {...attributes}
      >
        {isDraggable && (
          <Tooltip>
            <TooltipTrigger asChild>
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 hover:text-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Drag to assign</p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate mb-1">
            {item.description}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs font-medium">
              {weight}kg
            </Badge>

            {(customer || item.customer_name) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span className="truncate max-w-24">
                  {customer?.customer_name || item.customer_name}
                </span>
              </div>
            )}

            {(customer?.route_name || item.route_name) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Route className="h-3 w-3" />
                <span className="truncate max-w-20">
                  {customer?.route_name || item.route_name}
                </span>
              </div>
            )}

            {(customer?.suburb_name || item.suburb_name) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-20">
                  {customer?.suburb_name || item.suburb_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
})
