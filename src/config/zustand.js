import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Global live telemetry store powered by Zustand.
 * - Holds latest packet per plate in `liveByPlate`
 * - `upsertPackets` merges incoming packets
 * - Optional persistence (sessionStorage) so a soft reload can restore briefly
 */
export const useLiveStore = create(
  persist(
    (set, get) => ({
      liveByPlate: {},
      upsertPackets: (packets = []) => {
        if (!Array.isArray(packets) || packets.length === 0) return
        const next = { ...get().liveByPlate }
        for (const pkt of packets) {
          const plate = String(pkt?.Plate || '')
            .trim()
            .toUpperCase()
          if (!plate) continue
          next[plate] = { ...(next[plate] || {}), ...pkt }
        }
        set({ liveByPlate: next })
      },
      clearLive: () => set({ liveByPlate: {} }),
    }),
    {
      name: 'tcp-live-store',
      storage: createJSONStorage(() => sessionStorage), // use localStorage if you prefer
      // Only persist the latest snapshot; large histories should go to IndexedDB
      partialize: (state) => ({ liveByPlate: state.liveByPlate }),
    }
  )
)

// Helper selector: build cards array from a list of plates
export const selectVehicleCards =
  (plates = []) =>
  (state) => {
    const cards = []
    const live = state.liveByPlate || {}
    for (const p of plates) {
      const plate = String(p || '')
        .trim()
        .toUpperCase()
      if (!plate) continue
      cards.push({ plate, live: live[plate] || null })
    }
    return cards
  }
