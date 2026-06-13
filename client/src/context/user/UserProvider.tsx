import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import { baseWSURL } from '../../config'
import { UserContext } from './UserContext'
import { toast } from 'react-toastify'

export interface UserData {
  user_id: number
  role: 'ADMIN' | 'USER' | null
  first_name: string
  last_name: string
  email: string
  photoURL: string
  tg_id: string | null
  active?: boolean
  is_google?: boolean
  // expired_password?: boolean
}

const noUser: UserData = {
  user_id: -1,
  role: null,
  first_name: '',
  last_name: '',
  tg_id: '',
  email: '',
  photoURL: '',
}

interface UserProviderProps {
  children: ReactNode
}

function useSocket(
  user: UserData,
  token: string | null,
  setSIO: Dispatch<SetStateAction<Socket | null>>
) {
  useEffect(() => {
    if (!user || !token) return

    const socket = io(baseWSURL, {
      path: '/ws',
      transports: ['websocket'],
      auth: { token },
    })

    setSIO(socket)

    return () => {
      socket.disconnect()
    }
  }, [user, token, setSIO])
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<UserData>(noUser)
  const [token, setToken] = useState<string | null>(null)
  const [sio, setSIO] = useState<Socket | null>(null)
  const navigate = useNavigate()

  const login = (userData: UserData, token: string) => {
    if (token) {
      setUser(userData)
      setToken(token)
      localStorage.token = token
    }
  }

  const logout = (manual: boolean = false) => {
    if (manual) {
      if (
        confirm(
          'Вы уверены, что хотите выйти из аккаунта? Несохраненные изменения будут потеряны!'
        )
      ) {
        localStorage.clear()
      } else return
    } else {
      localStorage.removeItem('token')
    }
    setUser(noUser)
    navigate('/')
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.warn('This browser does not support notifications.')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      console.log('Notification permission granted!')
    }
  }

  useEffect(() => {
    requestNotificationPermission()
    if (localStorage.token) {
      verify().then((resv) => {
        if (resv) {
          login(resv.user, resv.token)
        } else {
          navigate('/signin')
          logout()
        }
      })
    }
  }, [])

  useSocket(user, token, setSIO)

  return (
    <UserContext.Provider value={{ user, login, logout, sio, setUser }}>
      {children}
    </UserContext.Provider>
  )
}
