import axios from 'axios'
import { toast } from 'react-toastify'
import { baseURL } from '../config'

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
    const res = await $host.post('auth/signup', {
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
    const res = await $host.post('auth/signin', {
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
    const res = await $host.post('auth/google', {
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

export const verify = async () => {
  try {
    const res = await $host.post('user/verify')
    return res.data
  } catch (e: any) {
    console.log(e)
  }
}

export const getUserStats = () => $host.get('/user/stats')
export const getUserActivity = (days = 7) =>
  $host.get(`/user/activity?days=${days}`)
export const getVerdictDistribution = () =>
  $host.get('/user/verdict-distribution')
export const getRecentChecks = (limit = 5) =>
  $host.get(`/user/recent-checks?limit=${limit}`)

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
  user_id: number | null
  createdAt: string
  updatedAt: string
  primary_risk: string | null
  reason_ru: string | null
  reason_en: string | null
  reason_kz: string | null
  uploader: string | null
  initiator?: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
}

export const getVideoAnalyses = async (params?: {
  is_dangerous?: boolean
  user_id?: number
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

export const getVideoAnalysesByUser = async (user_id: number) => {
  try {
    const res = await $host.get<VideoAnalysis[]>(
      `video-analysis/user/${user_id}`
    )
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

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

export const createAnalysisJob = async (url: string) => {
  try {
    const res = await $host.post('analysis-queue', {
      url,
    })
    return res.data
  } catch (e: any) {
    console.log(e)
  }
}

export interface SystemSettings {
  scanInterval: number
  autoRefreshNews: boolean
  newsParseInterval: number
  newsSources: string[]
  videoScrapeInterval: number
  scrapeLimitPerPlatform: number
  scrapeTimeoutSeconds: number
  enableYouTube: boolean
  enableTikTok: boolean
  enableInstagram: boolean
  scrapingEnabled: boolean
}

export interface ScrapeStatus {
  scrapingEnabled: boolean
  lastRun: string | null
  addedCount: number
  totalFound: number
  error: string | null
  queueCount: number
  totalAnalyzed: number
}

export const getSettings = async (): Promise<SystemSettings> => {
  try {
    const res = await $host.get<SystemSettings>('/settings')
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

export const updateSettings = async (
  settings: SystemSettings
): Promise<{ message: string; settings: SystemSettings }> => {
  try {
    const res = await $host.put<{ message: string; settings: SystemSettings }>(
      '/settings',
      settings
    )
    toast.success(res.data.message)
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

export const toggleScraping = async (): Promise<{
  message: string
  scrapingEnabled: boolean
}> => {
  try {
    const res = await $host.post<{
      message: string
      scrapingEnabled: boolean
    }>('/settings/toggle-scraping')
    toast.success(res.data.message)
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

export const triggerScrape = async (): Promise<{
  message: string
  addedCount: number
  totalFound: number
}> => {
  try {
    const res = await $host.post<{
      message: string
      addedCount: number
      totalFound: number
    }>('/settings/scrape-video')
    toast.success(res.data.message)
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

export const getScrapeStatus = async (): Promise<ScrapeStatus> => {
  try {
    const res = await $host.get<ScrapeStatus>('/settings/status')
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}
export interface FraudResource {
  id: number
  platform: 'youtube' | 'tiktok' | 'instagram' | 'telegram' | 'unknown'
  username: string
  channel_url: string | null
  display_name: string | null
  status: 'pending' | 'confirmed' | 'dismissed' | 'blocked'
  dangerous_videos_count: number
  description: string | null
  moderator_comment: string | null
  added_by: number | null
  verified_by: number | null
  verified_at: string | null
  tags: string | null
  createdAt: string
  updatedAt: string
  addedByUser?: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
  verifiedByUser?: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
}

export const getFraudResources = async (params?: {
  status?: string
  platform?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<{ total: number; data: FraudResource[] }> => {
  try {
    const res = await $host.get<{ total: number; data: FraudResource[] }>(
      '/fraud-resources',
      { params }
    )
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

export const getFraudResourceById = async (
  id: number
): Promise<FraudResource> => {
  try {
    const res = await $host.get<FraudResource>(`/fraud-resources/${id}`)
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

export const createFraudResource = async (
  data: Omit<
    FraudResource,
    'id' | 'createdAt' | 'updatedAt' | 'addedByUser' | 'verifiedByUser'
  >
): Promise<FraudResource> => {
  try {
    const res = await $host.post<FraudResource>('/fraud-resources', data)
    toast.success('Ресурс добавлен в реестр')
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

export const updateFraudResource = async (
  id: number,
  data: Partial<FraudResource>
): Promise<FraudResource> => {
  try {
    const res = await $host.put<FraudResource>(`/fraud-resources/${id}`, data)
    toast.success('Ресурс обновлён')
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

export const deleteFraudResource = async (id: number): Promise<void> => {
  try {
    await $host.delete(`/fraud-resources/${id}`)
    toast.success('Ресурс удалён')
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}
// ===== TikTok Live =====

export interface QueueItem {
  id: number
  url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  platform: string
  userId: number | null
  error_message: string | null
  processed_at: string | null
  priority: number
  retries: number
  createdAt: string
  updatedAt: string
  User?: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
}

export interface TiktokLiveStatus {
  enabled: boolean
  lastRun: string | null
  addedCount: number
  totalFound: number
  error: string | null
  queueCount: number
  totalAnalyzed: number
  processRunning: boolean
  pid: number | null
}

// Получить очередь TikTok Live
export const getTiktokLiveQueue = async (params?: {
  status?: string
  limit?: number
  offset?: number
}): Promise<{
  total: number
  data: QueueItem[]
  limit: number
  offset: number
}> => {
  try {
    const res = await $host.get('/analysis-queue', {
      params: { platform: 'tiktok_live', ...params },
    })
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

// Запустить парсинг TikTok Live
export const startTiktokLiveParsing = async (): Promise<{
  success: boolean
  message: string
  pid?: number
}> => {
  try {
    const res = await $host.get('/settings/tiktok-live/tiktoklive')
    toast.success(res.data.message)
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

// Остановить парсинг TikTok Live
export const stopTiktokLiveParsing = async (): Promise<{
  success: boolean
  message: string
}> => {
  try {
    const res = await $host.post('/settings/tiktok-live/stop')
    toast.success(res.data.message)
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

// Получить статус TikTok Live
export const getTiktokLiveStatus = async (): Promise<TiktokLiveStatus> => {
  try {
    const res = await $host.get('/settings/tiktok-live/status')
    return res.data
  } catch (e: any) {
    if (e.response?.data?.error) toast.error(e.response.data.error)
    console.log(e)
    throw e
  }
}

export interface TikTokLiveRecord {
  id: number
  authorName: string | null
  video_url: string
  safety_percent: number
  verdict_text: 'safe' | 'dangerous' | 'uncertain'
  reason_ru: string | null
  reason_en: string | null
  reason_kz: string | null
  is_dangerous: boolean
  duration_seconds: number
  checked_at: string
  primary_risk: string | null
  createdAt: string
  updatedAt: string
}

export interface TikTokLiveResponse {
  success: boolean
  data: TikTokLiveRecord[]
  total: number
  limit: number
  offset: number
}

// ==================== TikTok Live ====================

export interface TikTokLiveRecord {
  id: number
  authorName: string | null
  video_url: string
  safety_percent: number
  verdict_text: 'safe' | 'dangerous' | 'uncertain'
  reason_ru: string | null
  reason_en: string | null
  reason_kz: string | null
  is_dangerous: boolean
  duration_seconds: number
  checked_at: string
  primary_risk: string | null
  createdAt: string
  updatedAt: string
}

export interface TikTokLiveResponse {
  success: boolean
  data: TikTokLiveRecord[]
  total: number
  limit: number
  offset: number
}

// Получение данных
export const getTiktokLiveData = async (params?: {
  limit?: number
  offset?: number
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}): Promise<TikTokLiveResponse> => {
  try {
    const res = await $host.get<TikTokLiveResponse>(
      '/settings/tiktok-live/tiktok-live/data',
      {
        params,
      }
    )

    return res.data
  } catch (e: any) {
    console.log(e)

    if (e.response?.data?.error) {
      toast.error(e.response.data.error)
    }

    throw e
  }
}

// Получение одной записи
export const getTiktokLiveById = async (
  id: number
): Promise<{
  success: boolean
  data: TikTokLiveRecord
}> => {
  try {
    const res = await $host.get<{
      success: boolean
      data: TikTokLiveRecord
    }>(`/settings/tiktok-live/tiktok-live/data/${id}`)

    return res.data
  } catch (e: any) {
    console.log(e)

    if (e.response?.data?.error) {
      toast.error(e.response.data.error)
    }

    throw e
  }
}
