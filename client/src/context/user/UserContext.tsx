import { createContext } from 'react'
import type { UserData } from './UserProvider'
import type { Socket } from 'socket.io-client'

export interface UserContextProps {
  user: UserData
  setUser: (newUser: React.SetStateAction<UserData>) => void
  login: (userData: UserData, token: string) => void
  logout: (manual?: boolean) => void
  sio: Socket | null
}

export const UserContext = createContext<UserContextProps | undefined>(
  undefined
)
