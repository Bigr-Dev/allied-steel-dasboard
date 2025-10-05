// // export default AuthProvider

'use client'
import { useEffect, useReducer, useState } from 'react'
import { AuthContext, initialAuthState } from './initial-states/auth-state'
import authReducer from './reducers/auth-reducer'
import PageLoader from '@/components/ui/loader'
import { fetchData } from '@/lib/fetch'
import { fetchCurrentUser, loadCurrentUser } from './apis/auth-apis'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

const AuthProvider = ({ children, authFallback, currentUser, expiry, uid }) => {
  const { replace } = useRouter()
  const [current_user, currentUserDispatch] = useReducer(
    authReducer,
    initialAuthState
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      setLoading(true)

      // If token is expired or no uid, ensure state is cleared
      if (expiry || !uid) {
        currentUserDispatch({ type: 'CLEAR_CURRENT_USER' })
        if (!cancelled) setLoading(false)
        return
      }

      // If we have a server-provided user, hydrate client state
      if (currentUser) {
        loadCurrentUser(currentUserDispatch, currentUser)
        if (!cancelled) setLoading(false)
        return
      }

      // Otherwise, try fetch from API using cookies
      await fetchCurrentUser(currentUserDispatch).catch(() => {
        currentUserDispatch({ type: 'CLEAR_CURRENT_USER' })
      })
      if (!cancelled) setLoading(false)
    }

    init()
    return () => {
      cancelled = true
    }
  }, [uid, expiry, currentUser])

  // const login = async (userData) => {
  //   setLoading(true)
  //   try {
  //     const response = await fetchData('login', 'POST', userData)
  //     if (response) {
  //       await fetchCurrentUser(currentUserDispatch)
  //       // Go to your dashboard route (matches your folder structure)
  //       replace('/')
  //     }
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const login = async (userData) => {
    setLoading(true)
    try {
      const res = await fetchData('login', 'POST', userData)
      if (res) {
        await fetchCurrentUser(currentUserDispatch)
        const params = new URLSearchParams(window.location.search)
        const next = params.get('next') || '/'
        replace(next)
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      const response = await fetchData('logout', 'POST')
      if (response) {
        Cookies.remove('uid')
        currentUserDispatch({ type: 'CLEAR_CURRENT_USER' })
        replace('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  const isAuthed = !!current_user?.currentUser?.id

  return (
    <AuthContext.Provider value={{ current_user, loading, login, logout }}>
      {loading ? <PageLoader /> : isAuthed ? children : authFallback}
    </AuthContext.Provider>
  )
}

export default AuthProvider
