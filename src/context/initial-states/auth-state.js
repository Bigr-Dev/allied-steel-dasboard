// react
import { createContext, useContext } from 'react'

// initial state
export const initialAuthState = {
  currentUser: null,
  loading: false,
  error: null,
}

// context
export const AuthContext = createContext(initialAuthState)

// context provider
export const useAuth = () => {
  const context = useContext(AuthContext)
  return context
}
