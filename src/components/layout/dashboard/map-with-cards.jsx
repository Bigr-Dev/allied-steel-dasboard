'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ChevronRight, Truck } from 'lucide-react'
import MapViewMapbox from './map-box-view'
import CardsViewSidebar from './cards-view-slider-bar'

const STORAGE_KEY = 'fleet.map.cardsMinimized'

export default function MapWithCards({
  vehicleCards = [],
  selectedPlanId,
  targetPlates = [],
  assignedUnits = [],
  refreshKey = 0,
}) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') setIsMinimized(true)
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, String(isMinimized))
  }, [isMinimized])
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => setIsMobile(window.innerWidth < 768)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (isMobile) {
    return (
      <div className="h-full flex flex-col relative">
        <div className="flex-1 ">
          <MapViewMapbox
            vehicleCards={vehicleCards}
            assignedUnits={assignedUnits}
            selectedPlanId={selectedPlanId}
            refreshKey={refreshKey}
          />
        </div>
        <Button
          onClick={() => setIsMobileOpen(true)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg gap-2"
          size="lg"
        >
          <Truck className="w-4 h-4" />
          View Vehicles ({vehicleCards.length})
        </Button>
        <Sheet
          open={isMobileOpen}
          onOpenChange={(open) => {
            setIsMobileOpen(open)
            requestAnimationFrame(() => {
              setTimeout(
                () => window.dispatchEvent(new CustomEvent('fleet:map:resize')),
                320
              )
            })
          }}
        >
          <SheetContent side="bottom" className="h-[80vh] p-0">
            <SheetHeader className="px-4 pt-4">
              <SheetTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Vehicles ({vehicleCards.length})
              </SheetTitle>
            </SheetHeader>
            <div className="mt-2 overflow-auto h-[calc(80vh-72px)]">
              <CardsViewSidebar
                vehicleCards={vehicleCards}
                selectedPlanId={selectedPlanId}
                assignedUnits={assignedUnits}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <div className="h-screen flex relative ">
      <div className="flex-1">
        <MapViewMapbox
          refreshKey={refreshKey}
          key={selectedPlanId || 'all'}
          vehicleCards={vehicleCards}
          selectedPlanId={selectedPlanId}
          assignedUnits={assignedUnits}
        />
      </div>
    </div>
  )
}
