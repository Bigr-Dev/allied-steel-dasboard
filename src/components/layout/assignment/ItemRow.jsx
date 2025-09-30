'use client'

import { Badge } from '@/components/ui/badge'
import { GripVertical } from 'lucide-react'

export function ItemRow({
  item,
  customer,
  isDraggable = false,
  isUnassigned = false,
}) {
  const weight = isUnassigned ? item.weight_left : item.assigned_weight_kg

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      {isDraggable && (
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {weight}kg
          </Badge>
          {(customer || item.customer_name) && (
            <span className="text-xs text-muted-foreground">
              {customer?.customer_name || item.customer_name}
            </span>
          )}
          {(customer?.route_name || item.route_name) && (
            <span className="text-xs text-muted-foreground">
              • {customer?.route_name || item.route_name}
            </span>
          )}
          {(customer?.suburb_name || item.suburb_name) && (
            <span className="text-xs text-muted-foreground">
              • {customer?.suburb_name || item.suburb_name}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
