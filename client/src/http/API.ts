import axios from 'axios'
import { toast } from 'react-toastify'
import { baseURL } from '../config'

const host = axios.create({
  baseURL,
})

export const $host = axios.create({ baseURL })

$host.interceptors.request.use((config) => {
  const token = localStorage.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const signUp = async (
  first_name: string,
  last_name: string,
  email: string,
  password: string
) => {
  try {
    const res = await host.post('auth/signup', {
      first_name,
      last_name,
      email,
      password,
    })

    toast.success(res.data.message)

    return res.data
  } catch (e: any) {
    if (e.response?.data?.message) toast.error(e.response.data.message)
    console.log(e)
  }
}
export const signIn = async (email: string, password: string) => {
  try {
    const res = await host.post('auth/signin', {
      email,
      password,
    })

    toast.success(res.data.message)

    return res.data
  } catch (e: any) {
    if (e.response?.data?.message) toast.error(e.response.data.message)
    console.log(e)
  }
}
export const googleLogin = async (idToken: string) => {
  try {
    const res = await host.post('auth/google', {
      idToken,
    })

    toast.success(res.data.message)

    return res.data
  } catch (e: any) {
    if (e.response?.data?.message) toast.error(e.response.data.message)
    console.log(e)
  }
}
export const verify = async () => {
  try {
    const res = await $host.post('user/verify')
    return res.data
  } catch (e: any) {
    console.log(e)
  }
}
export const bindTg = async (tg_id: string) => {
  try {
    const res = await $host.post('user/bind_tg', { tg_id })
    toast.success(res.data.message)
    return res.data
  } catch (e: any) {
    if (e.response?.data?.message) toast.error(e.response.data.message)
    console.log(e)
  }
}

export const sendTg = async (message: string) => {
  try {
    const res = await $host.post('user/send_tg', { message })
    toast.success(res.data.message)
    return res.data
  } catch (e: any) {
    if (e.response?.data?.message) toast.error(e.response.data.message)
    console.log(e)
  }
}

export const sendEmail = async () => {
  try {
    const res = await $host.post('user/email')
    toast.success(res.data.message)
    return res.data
  } catch (e: any) {
    if (e.response?.data?.message) toast.error(e.response.data.message)
    console.log(e)
  }
}

export const confirmEmail = async (secret: string) => {
  try {
    const res = await $host.post('user/conf_email', { secret })
    toast.success(res.data.message)
    return res.data
  } catch (e: any) {
    if (e.response?.data?.message) toast.error(e.response.data.message)
    console.log(e)
  }
}

export const getUsers = async (id?: string) => {
  try {
    const res = await $host.get('auth/users', { params: { id } })

    toast.success(res.data.message)

    return res.data
  } catch (e: any) {
    if (e.response?.data?.message) toast.error(e.response.data.message)
    console.log(e)
  }
}

export const getCharacters = async () => {
  try {
    const res = await $host.get('/characters')
    return res.data // ожидаем массив объектов { id, name, description, ... }
  } catch (e: any) {
    console.log(e)
    return [] // в случае ошибки возвращаем пустой массив
  }
}

export const getMessages = async (characterId: number) => {
  try {
    const res = await $host.get(`/messages/${characterId}`)
    return res.data
  } catch (error) {
    console.error('Error loading messages:', error)
    throw error
  }
}

export const saveMessage = async (data: {
  character_id: number
  userMessage: string
  modelMessage: string
  audioId?: string | null
}) => {
  try {
    const res = await $host.post('/messages', data)
    return res.data
  } catch (error) {
    console.error('Error saving message:', error)
    throw error
  }
}

export const getLastMessageDates = async () => {
  try {
    // Этот эндпоинт нужно создать на сервере
    const res = await $host.get('/messages/last-dates/all')
    return res.data // ожидаем объект { [characterId]: lastMessageDate }
  } catch (error) {
    console.error('Error loading last message dates:', error)
    return {}
  }
}

export const deleteCharacter = async (id: number) => {
  try {
    const res = await $host.delete(`/characters/${id}`)
    return res.data
  } catch (e) {
    console.log('Ошибка удаления персонажа:', e)
    throw e
  }
}

export const createCharacter = async (data: FormData) => {
  try {
    const res = await $host.post('/characters', data)
    return res.data
  } catch (e: any) {
    console.log('Ошибка создания персонажа:', e.response?.data || e.message)
    throw e
  }
}

export const getUserBalance = async () => {
  try {
    const res = await $host.get('/user/balance')
    return res.data.balance
  } catch (e) {
    console.error('Error fetching balance:', e)
    return 0
  }
}
// Получить список пользователей (админ)
export const getAdminUsers = async () => {
  const res = await $host.get('/balance/admin/users')
  return res.data
}

// Изменить баланс пользователя (админ)
export const updateUserBalance = async (userId: number, balance: number) => {
  const res = await $host.put(`/balance/admin/users/${userId}/balance`, {
    balance,
  })
  return res.data
}

// Создать заявку на пополнение
export const createBalanceRequest = async (data: {
  amount: number
  paymentMethod: string
  comment: string
}) => {
  const res = await $host.post('/balance/requests', data)
  return res.data
}

// Получить заявки (админ)
export const getBalanceRequests = async () => {
  const res = await $host.get('/balance/requests')
  return res.data
}

// Обновить статус заявки (админ)
export const updateBalanceRequest = async (id: number, status: string) => {
  const res = await $host.put(`/balance/requests/${id}`, { status })
  return res.data
}

export const getMessageStats = async () => {
  const res = await $host.get('/characters/stats')
  return res.data // { characterId: count }
}

export const getTags = async () => {
  const res = await $host.get('/tags')
  return res.data
}

export const getSamples = async () => {
  const res = await $host.get('/samples/get')
  return res.data
}

export const getOnlineCount = async () => {
  const res = await $host.get('/stats/online')
  return res.data.online
}

export const getVisitsStats = async () => {
  const response = await $host.get('/analytics/visits/weekly')
  return response.data
}

export const getTotalUsersCount = async (): Promise<number> => {
  try {
    const response = await $host.get('/stats/users/count')
    return response.data.count
  } catch (error) {
    console.error('Ошибка получения количества пользователей:', error)
    return 0
  }
}
