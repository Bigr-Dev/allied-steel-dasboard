'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatWeight, formatQty, formatLength } from '@/lib/formatters'

export default function ItemsSubTable({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No items found
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Items</h4>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Description</TableHead>
              <TableHead className="text-xs text-right">Qty</TableHead>
              <TableHead className="text-xs text-right">Weight</TableHead>
              <TableHead className="text-xs text-right">Length</TableHead>
              <TableHead className="text-xs">UR Prod</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id || index} className="text-xs">
                <TableCell className="font-medium">
                  {item.description || 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  {formatQty(item.quantity)}
                </TableCell>
                <TableCell className="text-right">
                  {formatWeight(item.weight)}
                </TableCell>
                <TableCell className="text-right">
                  {formatLength(item.length)}
                </TableCell>
                <TableCell>{item.ur_prod || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
