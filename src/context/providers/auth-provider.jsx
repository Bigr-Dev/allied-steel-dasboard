'use client'
import { useEffect, useReducer, useState } from 'react'
import { AuthContext, initialAuthState } from './initial-states/auth-state'
import authReducer from './reducers/auth-reducer'
import PageLoader from '@/components/ui/loader'
import { fetchData } from '@/lib/fetch'
import { fetchCurrentUser, loadCurrentUser } from './apis/auth-apis'
import Cookies from 'js-cookie'
import { redirect } from 'next/dist/server/api-utils'

const AuthProvider = ({ children, authFallback, currentUser, expiry, uid }) => {
  const [current_user, currentUserDispatch] = useReducer(
    authReducer,
    initialAuthState
  )

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentUser) {
      loadCurrentUser(currentUserDispatch, currentUser)
      setLoading(false)
    }

    // else {
    //   currentUserDispatch({ type: 'CLEAR_CURRENT_USER' })
    //   setLoading(false)
    // }
  }, [uid, expiry, currentUser])

  const login = async (userData) => {
    setLoading(true)
    const response = await fetchData('login', 'POST', userData)

    if (response) {
      console.log('fetching current user :>> ')
      await fetchCurrentUser(currentUserDispatch)
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
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        current_user,
        loading,
        login,
        logout,
      }}
    >
      {expiry || !uid ? authFallback : children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
