'use client'
import { useAssignment } from '@/context/providers/assignment-provider'
import { useUI } from '@/context/providers/ui-provider'
import { useToast } from '@/hooks/use-toast'
import { handleAPIError } from '@/lib/api-client'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { useMemo, useState, useEffect, useRef } from 'react'
import DetailActionBar from '../layout/detail-action-bar'
import { UnassignedList } from '../layout/assignment/UnassignedList'
import { VehicleCard } from '../layout/assignment/VehicleCard'
import { createPortal } from 'react-dom'

// ... rest of file remains the same until LoadAssignmentSingle component

const LoadAssignmentSingle = ({ id, data }) => {
  const { assignment_preview, setAssignmentPreview } = useAssignment()
  const { fetchData } = useUI()
  const { toast } = useToast()

  // ... rest of component remains unchanged
}

export default LoadAssignmentSingle
