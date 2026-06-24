import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import { verify } from '../../http/API'
import { baseWSURL } from '../../config'
import { UserContext } from './UserContext'
import { toast } from 'react-toastify'

export interface UserData {
  user_id: number
  role: 'USER' | 'INSPECTOR' | 'ADMIN' | null
  first_name: string
  last_name: string
  email: string
  photoURL: string
  tg_id: string | null
  active?: boolean
  is_google?: boolean
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
        setUser(noUser)
        navigate('/')
      } else return
    } else {
      localStorage.removeItem('token')
      setUser(noUser)
    }
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
    const storedToken = localStorage.token
    if (storedToken) {
      verify()
        .then((resv) => {
          if (resv && resv.user) {
            // Преобразуем id → user_id, если сервер возвращает id
            const mappedUser: UserData = {
              user_id: resv.user.id || resv.user.user_id,
              role: resv.user.role, // теперь может быть 'INSPECTOR'
              first_name: resv.user.first_name || '',
              last_name: resv.user.last_name || '',
              email: resv.user.email || '',
              photoURL: resv.user.photoURL || '',
              tg_id: resv.user.tg_id || null,
              is_google: resv.user.is_google || false,
            }
            login(mappedUser, resv.token || storedToken)
          } else {
            localStorage.removeItem('token')
            setUser(noUser)
          }
        })
        .catch((err) => {
          console.error('Ошибка верификации токена:', err)
          localStorage.removeItem('token')
          setUser(noUser)
        })
    }
  }, [])

  // useSocket(user, token, setSIO)

  return (
    <UserContext.Provider value={{ user, login, logout, sio, setUser }}>
      {children}
    </UserContext.Provider>
  )
}
