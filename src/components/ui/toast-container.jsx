// components/ui/toaster.tsx
'use client'

import { useAuth } from '@/context/initial-states/auth-state'
import { useToast } from '@/hooks/use-toast'

export const Toaster = () => {
  const { toasts, dismiss } = useToast()
  const { logout } = useAuth()

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) =>
        toast.open ? (
          <div
            key={toast.id}
            className="bg-white border border-gray-200 shadow-lg p-4 rounded-lg max-w-sm"
          >
            <div>test</div>
            <div className="font-semibold">{toast.title}</div>
            <div className="text-sm text-gray-600">{toast.description}</div>
            <div className=" flex justify-between">
              {toast.signout ? (
                <button
                  className="mt-2 text-sm text-blue-500 underline"
                  onClick={() => {
                    logout()
                    dismiss(toast.id)
                  }}
                >
                  Logout
                </button>
              ) : (
                <button
                  className="mt-2 text-sm text-blue-500 underline"
                  onClick={() => dismiss(toast.id)}
                >
                  Close
                </button>
              )}
              {toast?.continue && (
                <button
                  className="mt-2 text-sm text-blue-500 underline"
                  onClick={() => toast.continue(toast.id)}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        ) : null
      )}
    </div>
  )
}
