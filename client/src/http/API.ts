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

// ========== Video Analysis API ==========

export interface VideoAnalysis {
  id: number
  video_url: string
  title: string | null
  tags: string | null
  safety_percent: number
  verdict_text: 'safe' | 'dangerous' | 'uncertain'
  is_dangerous: boolean
  duration_seconds: number
  preview_image_url: string | null
  checked_at: string
  userId: number | null
  createdAt: string
  updatedAt: string
  initiator?: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
}

// Получить все видео-анализы (с фильтрацией и пагинацией)
export const getVideoAnalyses = async (params?: {
  is_dangerous?: boolean
  userId?: number
  limit?: number
  offset?: number
}) => {
  try {
    const res = await $host.get<{ total: number; data: VideoAnalysis[] }>(
      'video-analysis',
      { params }
    )
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

// Получить один видео-анализ по ID
export const getVideoAnalysisById = async (id: number) => {
  try {
    const res = await $host.get<VideoAnalysis>(`video-analysis/${id}`)
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

// Получить анализы конкретного пользователя
export const getVideoAnalysesByUser = async (userId: number) => {
  try {
    const res = await $host.get<VideoAnalysis[]>(
      `video-analysis/user/${userId}`
    )
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

// Удалить анализ (только для админа или владельца)
export const deleteVideoAnalysis = async (id: number) => {
  try {
    const res = await $host.delete(`video-analysis/${id}`)
    toast.success('Анализ удалён')
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}
