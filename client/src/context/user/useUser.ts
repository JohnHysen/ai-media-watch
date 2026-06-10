import { useContext } from 'react'
import { UserContext, type UserContextProps } from './UserContext'

export const useUser = (): UserContextProps => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
