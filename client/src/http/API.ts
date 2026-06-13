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
