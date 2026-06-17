import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Avatar,
  Box,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper as TablePaper,
  Link,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import WarningIcon from '@mui/icons-material/Warning'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import LinkIcon from '@mui/icons-material/Link'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PieChartIcon from '@mui/icons-material/PieChart'
import CasinoIcon from '@mui/icons-material/Casino'
import SecurityIcon from '@mui/icons-material/Security'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import YouTubeIcon from '@mui/icons-material/YouTube'
import InstagramIcon from '@mui/icons-material/Instagram'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import CloseIcon from '@mui/icons-material/Close'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  Float,
  Environment,
  Html,
  Stars,
} from '@react-three/drei'
import * as THREE from 'three'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUser } from '../context/user/useUser'
import CyberSidebar from '../components/CyberSidebar'
import { $host, getVideoAnalyses, VideoAnalysis } from '../http/API'

// ---------- 3D фон с логотипами соцсетей ----------
const FloatingIconsOnly = () => {
  const groupRef = useRef<THREE.Group>(null!)
  const elements = useMemo(
    () => [
      {
        image: '/youtube-logo.png',
        color: '#ff0000',
        size: 1.6,
        startX: -3.5,
        startY: 1.5,
        startZ: -2,
      },
      {
        image: '/instagram-logo.png',
        color: '#e4405f',
        size: 1.6,
        startX: 4,
        startY: -1.5,
        startZ: -1.5,
      },
      {
        image: '/tik-tok.png',
        color: '#00f2ea',
        size: 1.6,
        startX: -2,
        startY: -2.5,
        startZ: -3,
      },
      {
        symbol: '🛡️',
        color: '#33ffcc',
        size: 1.5,
        startX: 3,
        startY: 2,
        startZ: -2,
      },
      {
        symbol: '⚠️',
        color: '#ff3366',
        size: 1.5,
        startX: 0,
        startY: -0.5,
        startZ: -4,
      },
    ],
    []
  )

  const motions = useMemo(
    () =>
      elements.map(() => ({
        ampX: 2.0 + Math.random() * 1.5,
        ampY: 1.5 + Math.random() * 1.2,
        ampZ: 1.2 + Math.random() * 1.0,
        freqX: 0.12 + Math.random() * 0.08,
        freqY: 0.1 + Math.random() * 0.08,
        freqZ: 0.09 + Math.random() * 0.07,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        rotSpeed: 0.003 + Math.random() * 0.003,
      })),
    []
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.children.forEach((child, idx) => {
        const el = elements[idx]
        const m = motions[idx]
        if (el && m) {
          const x = el.startX + m.ampX * Math.sin(m.freqX * t + m.phaseX)
          const y = el.startY + m.ampY * Math.sin(m.freqY * t + m.phaseY)
          const z = el.startZ + m.ampZ * Math.sin(m.freqZ * t + m.phaseZ)
          child.position.set(x, y, z)
          child.rotation.y += m.rotSpeed
          child.rotation.x += m.rotSpeed * 0.5
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {elements.map((el, idx) => (
        <Float
          key={idx}
          speed={0.4}
          rotationIntensity={0.15}
          floatIntensity={0.2}
        >
          <mesh position={[el.startX, el.startY, el.startZ]}>
            <planeGeometry args={[el.size, el.size]} />
            <meshStandardMaterial
              color={el.color}
              emissive={el.color}
              emissiveIntensity={0.25}
              side={THREE.DoubleSide}
              transparent
              opacity={0.9}
            />
            <Html distanceFactor={14} position={[0, 0, 0.05]} transform center>
              {el.symbol ? (
                <div
                  style={{
                    fontSize: `${el.size * 45}px`,
                    textAlign: 'center',
                    filter: `drop-shadow(0 0 8px ${el.color})`,
                    pointerEvents: 'none',
                  }}
                >
                  {el.symbol}
                </div>
              ) : el.image ? (
                <img
                  src={el.image}
                  alt="social"
                  style={{
                    width: `${el.size * 45}px`,
                    height: `${el.size * 45}px`,
                    objectFit: 'contain',
                    filter: `drop-shadow(0 0 8px ${el.color})`,
                    pointerEvents: 'none',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentNode
                    const fallback = document.createElement('div')
                    fallback.textContent = '📱'
                    fallback.style.fontSize = `${el.size * 45}px`
                    fallback.style.filter = `drop-shadow(0 0 8px ${el.color})`
                    fallback.style.pointerEvents = 'none'
                    parent?.appendChild(fallback)
                  }}
                />
              ) : null}
            </Html>
          </mesh>
        </Float>
      ))}
    </group>
  )
}

const CyberBackground3D = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        backgroundColor: '#03030f',
      }}
    >
      <Canvas
        camera={{ position: [0, 1, 14], fov: 50 }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.7} />
        <pointLight position={[-5, -5, 5]} color="#ff3366" intensity={0.3} />
        <FloatingIconsOnly />
        <Stars
          radius={100}
          depth={50}
          count={1200}
          factor={4}
          saturation={0}
          fade
          speed={0.2}
        />
        <Environment preset="night" />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.15}
          target={[0, 0, 0]}
        />
      </Canvas>
    </Box>
  )
}

// ---------- Компонент спидометра ----------
interface CyberSpeedometerProps {
  value: number
  label?: string
  size?: number
}

const CyberSpeedometer: React.FC<CyberSpeedometerProps> = ({
  value,
  label = 'Уровень опасности',
  size = 200,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const target = Math.min(100, Math.max(0, value))
    const duration = 1000
    const startTime = performance.now()

    const animate = (time: number) => {
      const progress = Math.min(1, (time - startTime) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased
      setAnimatedValue(current)
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setAnimatedValue(target)
      }
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [value])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const centerX = w / 2
    const centerY = h / 2
    const radius = Math.min(w, h) / 2 - 20

    ctx.clearRect(0, 0, w, h)

    const startAngle = Math.PI * 0.75
    const endAngle = Math.PI * 2.25
    const arcLength = endAngle - startAngle

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 20
    ctx.lineCap = 'round'
    ctx.stroke()

    const gradient = ctx.createLinearGradient(0, 0, w, 0)
    gradient.addColorStop(0, '#33ffcc')
    gradient.addColorStop(0.5, '#ffaa44')
    gradient.addColorStop(1, '#ff3366')

    const currentAngle = startAngle + arcLength * (animatedValue / 100)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, currentAngle)
    ctx.strokeStyle = gradient
    ctx.lineWidth = 20
    ctx.lineCap = 'round'
    ctx.stroke()

    const arrowLength = radius - 10
    const arrowAngle = startAngle + arcLength * (animatedValue / 100)
    const arrowX = centerX + Math.cos(arrowAngle) * arrowLength
    const arrowY = centerY + Math.sin(arrowAngle) * arrowLength

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(arrowX, arrowY)
    ctx.strokeStyle = '#0ff'
    ctx.lineWidth = 4
    ctx.shadowColor = '#0ff'
    ctx.shadowBlur = 15
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.beginPath()
    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2)
    ctx.fillStyle = '#0ff'
    ctx.shadowColor = '#0ff'
    ctx.shadowBlur = 20
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.font = `bold ${radius * 0.4}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.shadowColor = '#0ff'
    ctx.shadowBlur = 10
    ctx.fillText(Math.round(animatedValue) + '%', centerX, centerY - 10)
    ctx.shadowBlur = 0

    ctx.font = `${radius * 0.12}px sans-serif`
    ctx.fillStyle = '#aaa'
    ctx.textBaseline = 'top'
    ctx.fillText(label, centerX, centerY + radius * 0.3)
  }, [animatedValue, label])

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: size,
          maxWidth: size,
        }}
      />
    </Box>
  )
}

// ---------- Типы вердиктов ----------
const VERDICT_TYPES = {
  safe: { label: 'Безопасно', color: '#33ffcc', icon: '✅' },
  dangerous: { label: 'Опасно', color: '#ff3366', icon: '⚠️' },
  uncertain: { label: 'Неопределённо', color: '#ffaa44', icon: '❓' },
}

// ---------- Главный компонент ----------
const CyberMediaWatchPro = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [checkResultMessage, setCheckResultMessage] = useState<string | null>(
    null
  )
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week')
  const [selectedVerdictFilter, setSelectedVerdictFilter] = useState<string[]>(
    []
  )
  const [videoAnalyses, setVideoAnalyses] = useState<VideoAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Состояния для модального окна
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoAnalysis | null>(null)

  const isAdmin = user?.role === 'ADMIN'
  const { i18n } = useTranslation()

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getVideoAnalyses({ limit: 1000, offset: 0 })
      setVideoAnalyses(response.data)
    } catch (err: any) {
      console.error('Ошибка загрузки видеоанализов:', err)
      setError('Не удалось загрузить данные с сервера')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredThreats = useMemo(() => {
    let threats = [...videoAnalyses]
    const now = new Date()
    if (timeframe === 'day') {
      threats = threats.filter(
        (t) => new Date(t.checked_at) > new Date(now.getTime() - 24 * 3600000)
      )
    } else if (timeframe === 'week') {
      threats = threats.filter(
        (t) => new Date(t.checked_at) > new Date(now.getTime() - 7 * 86400000)
      )
    } else if (timeframe === 'month') {
      threats = threats.filter(
        (t) => new Date(t.checked_at) > new Date(now.getTime() - 30 * 86400000)
      )
    }
    if (selectedVerdictFilter.length > 0) {
      threats = threats.filter((t) =>
        selectedVerdictFilter.includes(t.verdict_text)
      )
    }
    return threats
  }, [videoAnalyses, timeframe, selectedVerdictFilter])

  const verdictStats = useMemo(() => {
    const stats: Record<string, number> = {}
    filteredThreats.forEach((t) => {
      stats[t.verdict_text] = (stats[t.verdict_text] || 0) + 1
    })
    return Object.entries(stats).map(([name, value]) => ({
      name: VERDICT_TYPES[name as keyof typeof VERDICT_TYPES]?.label || name,
      value,
      color: VERDICT_TYPES[name as keyof typeof VERDICT_TYPES]?.color || '#fff',
    }))
  }, [filteredThreats])

  const dangerLevel = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d
    })
    const relevant = filteredThreats.filter((t) => {
      const date = new Date(t.checked_at)
      return last7Days.some((day) => date.toDateString() === day.toDateString())
    })
    if (relevant.length === 0) return 0
    const avgDangerPercent =
      relevant.reduce((sum, t) => sum + (100 - (t.safety_percent || 0)), 0) /
      relevant.length
    return Math.round(avgDangerPercent)
  }, [filteredThreats])

  const topRiskyVideos = useMemo(() => {
    return [...filteredThreats]
      .sort((a, b) => {
        if (a.is_dangerous !== b.is_dangerous) return a.is_dangerous ? -1 : 1
        return (a.safety_percent || 0) - (b.safety_percent || 0)
      })
      .slice(0, 6)
  }, [filteredThreats])

  const recentThreats = useMemo(() => {
    return [...filteredThreats]
      .sort(
        (a, b) =>
          new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
      )
      .slice(0, 8)
  }, [filteredThreats])

  const stats = useMemo(() => {
    const totalVideos = videoAnalyses.length
    const dangerousCount = videoAnalyses.filter((v) => v.is_dangerous).length
    const uniqueUsers = new Set(
      videoAnalyses.filter((v) => v.userId).map((v) => v.userId)
    ).size
    const platforms = new Set(
      videoAnalyses.map((v) => {
        try {
          const url = new URL(v.video_url)
          return url.hostname.replace('www.', '').split('.')[0]
        } catch {
          return 'unknown'
        }
      })
    )
    return {
      totalVideos,
      dangerousCount,
      uniqueUsers,
      platformsCount: platforms.size,
    }
  }, [videoAnalyses])

  const handleCheckVideo = async () => {
    if (!videoUrl.trim()) return
    setIsChecking(true)
    try {
      const userIdParam = user?.user_id ? `&userId=${user.user_id}` : ''
      const response = await fetch(
        `http://localhost:3500/analyze?url=${encodeURIComponent(videoUrl)}${userIdParam}`
      )
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Ошибка сервера')
      }
      const data = await response.json()
      const riskPercent = data.confidence * 100
      let message = ''
      if (riskPercent > 70) {
        message = `⚠️ КРИТИЧЕСКАЯ УГРОЗА: риск ${riskPercent.toFixed(1)}%! ${data.verdict}`
      } else if (riskPercent > 40) {
        message = `🔔 Высокий риск: ${riskPercent.toFixed(1)}%! ${data.verdict}`
      } else {
        message = `✅ Видео проверено. Риск ${riskPercent.toFixed(1)}%. ${data.verdict}`
      }
      setCheckResultMessage(message)

      const isDangerous = data.is_dangerous === true
      const safetyPercent = isDangerous
        ? (1 - data.confidence) * 100
        : data.confidence * 100
      let verdictText: 'safe' | 'dangerous' | 'uncertain' = 'safe'
      if (isDangerous) verdictText = 'dangerous'
      else if (data.confidence < 0.6) verdictText = 'uncertain'
      else verdictText = 'safe'

      const durationSeconds = data.duration_seconds || 0

      await $host.post('/video-analysis', {
        video_url: videoUrl,
        title: data.video_title || null,
        tags: null,
        safety_percent: safetyPercent,
        verdict_text: verdictText,
        is_dangerous: isDangerous,
        duration_seconds: durationSeconds,
        preview_image_url: null,
        checked_at: new Date().toISOString(),
        userId: user?.user_id || null,
      })
      await fetchData()
    } catch (error: any) {
      console.error('Ошибка при проверке видео:', error)
      setCheckResultMessage(`❌ Ошибка: ${error.message}`)
    } finally {
      setIsChecking(false)
      setVideoUrl('')
      setTimeout(() => setCheckResultMessage(null), 7000)
    }
  }

  const handleVideoClick = (video: VideoAnalysis) => {
    setSelectedVideo(video)
    setModalOpen(true)
  }

  const langs = [
    { v: 'ru', l: 'Русский', flag: '🇷🇺' },
    { v: 'en', l: 'English', flag: '🇬🇧' },
    { v: 'kz', l: 'Қазақша', flag: '🇰🇿' },
  ]

  // Функция для получения цвета вердикта
  const getVerdictChip = (verdict: string) => {
    const map = {
      safe: { label: 'Безопасно', color: '#44ff66' },
      dangerous: { label: 'Опасно', color: '#ff3366' },
      uncertain: { label: 'Неопределённо', color: '#ffaa44' },
    }
    const info = map[verdict as keyof typeof map] || map.uncertain
    return (
      <Chip
        label={info.label}
        sx={{ bgcolor: info.color, color: '#000', fontWeight: 'bold' }}
      />
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: '#fff',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <CyberBackground3D />
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,51,102,0.05) 0%, transparent 50%), linear-gradient(90deg, rgba(0,255,255,0.01) 1px, transparent 1px), linear-gradient(0deg, rgba(0,255,255,0.01) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 1200,
            color: '#0ff',
            bgcolor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            '&:hover': { bgcolor: '#0ff', color: '#000' },
          }}
        >
          <MenuIcon />
        </IconButton>
        <Box
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1200,
            display: 'flex',
            gap: 1,
          }}
        >
          <FormControl
            sx={{
              bgcolor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
            }}
          >
            <Select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              sx={{ color: '#0ff', minWidth: 130 }}
            >
              {langs.map((lang) => (
                <MenuItem key={lang.v} value={lang.v}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {lang.flag} {lang.l}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <CyberSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', px: 3, py: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Typography
              variant="h1"
              sx={{
                textAlign: 'center',
                fontWeight: 900,
                fontSize: { xs: '2.2rem', md: '4rem' },
                background: 'linear-gradient(135deg, #ff3366, #33ffcc)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 20px rgba(255,51,102,0.5)',
                mb: 1,
              }}
            >
              AI MEDIA WATCH PRO
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ textAlign: 'center', color: '#88f', mb: 4 }}
            >
              🛡️ Мониторинг угроз в реальном времени • 3D-аналитика •
              Превентивные предупреждения
            </Typography>
          </motion.div>
          <AnimatePresence>
            {checkResultMessage && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <Alert
                  severity={
                    checkResultMessage.includes('✅') ? 'success' : 'warning'
                  }
                  sx={{
                    mb: 3,
                    borderRadius: 4,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    border: `1px solid ${checkResultMessage.includes('✅') ? '#44ff66' : '#ff3366'}`,
                    color: '#fff',
                  }}
                >
                  {checkResultMessage}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
            <Card
              sx={{
                maxWidth: 700,
                width: '100%',
                bgcolor: 'rgba(10,10,30,0.6)',
                backdropFilter: 'blur(12px)',
                borderRadius: 4,
                border: '1px solid rgba(0,255,255,0.4)',
                boxShadow: '0 0 20px rgba(0,255,255,0.2)',
                p: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                  color: '#0ff',
                }}
              >
                <LinkIcon /> Анализ видео по ссылке
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Вставьте ссылку на TikTok / Instagram / YouTube"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  fullWidth
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '40px',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      '& fieldset': { borderColor: '#0ff' },
                    },
                    input: { color: '#fff' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#0ff' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleCheckVideo}
                  disabled={isChecking}
                  sx={{
                    borderRadius: '40px',
                    background: 'linear-gradient(45deg, #ff3366, #ff6633)',
                    px: 4,
                    '&:hover': { boxShadow: '0 0 15px #ff3366' },
                  }}
                >
                  {isChecking ? (
                    <CircularProgress size={24} sx={{ color: '#fff' }} />
                  ) : (
                    'Проверить'
                  )}
                </Button>
              </Box>
              <Typography
                variant="caption"
                sx={{ mt: 1, color: '#aaa', display: 'block' }}
              >
                🧠 Мультимодальный AI: видео, аудио, OCR, граф связей. Результат
                через 1-2 минуты.
              </Typography>
            </Card>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress sx={{ color: '#0ff' }} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : (
            <>
              <Grid container spacing={3} sx={{ mb: 5 }}>
                {[
                  {
                    icon: <VideoLibraryIcon />,
                    label: 'Видео обработано',
                    value: stats.totalVideos,
                    color: '#33ffcc',
                  },
                  {
                    icon: <WarningIcon />,
                    label: 'Угроз выявлено',
                    value: stats.dangerousCount,
                    color: '#ff3366',
                  },
                  {
                    icon: <TrendingUpIcon />,
                    label: 'Авторов в топе',
                    value: stats.uniqueUsers,
                    color: '#ffaa44',
                  },
                ].map((item, idx) => (
                  <Grid size={{ xs: 6, md: 3 }} key={idx}>
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: 3,
                          border: `1px solid ${item.color}`,
                          textAlign: 'center',
                          py: 2,
                          transition: '0.2s',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: `0 0 20px ${item.color}`,
                          },
                        }}
                      >
                        <CardContent>
                          <Box sx={{ fontSize: 40, color: item.color }}>
                            {item.icon}
                          </Box>
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 'bold',
                              fontFamily: 'monospace',
                              color: '#fff',
                            }}
                          >
                            {item.value}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            {item.label}
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
                {/* Карточка "Платформ" с иконками */}
                <Grid size={{ xs: 6, md: 3 }}>
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card
                      sx={{
                        bgcolor: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: 3,
                        border: '1px solid #aa66ff',
                        textAlign: 'center',
                        py: 2,
                        transition: '0.2s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 0 20px #aa66ff',
                        },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <YouTubeIcon
                            sx={{ fontSize: 40, color: '#ff0000' }}
                          />
                          <InstagramIcon
                            sx={{ fontSize: 40, color: '#e4405f' }}
                          />
                          <MusicNoteIcon
                            sx={{ fontSize: 40, color: '#00f2ea' }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#fff' }}>
                          Платформы: YouTube, Instagram, TikTok
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  mb: 3,
                  gap: 2,
                }}
              >
                <ToggleButtonGroup
                  value={timeframe}
                  exclusive
                  onChange={(_, val) => val && setTimeframe(val)}
                  sx={{
                    '& .MuiToggleButton-root': {
                      color: '#fff',
                      borderColor: '#0ff',
                      '&.Mui-selected': { bgcolor: '#0ff', color: '#000' },
                    },
                  }}
                >
                  <ToggleButton value="day">День</ToggleButton>
                  <ToggleButton value="week">Неделя</ToggleButton>
                  <ToggleButton value="month">Месяц</ToggleButton>
                </ToggleButtonGroup>
                <FormControl
                  size="small"
                  sx={{
                    minWidth: 200,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    borderRadius: 2,
                  }}
                >
                  <InputLabel sx={{ color: '#0ff' }}>Вердикт</InputLabel>
                  <Select
                    multiple
                    value={selectedVerdictFilter}
                    onChange={(e) =>
                      setSelectedVerdictFilter(
                        typeof e.target.value === 'string'
                          ? e.target.value.split(',')
                          : e.target.value
                      )
                    }
                    label="Вердикт"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={
                              VERDICT_TYPES[value as keyof typeof VERDICT_TYPES]
                                ?.label
                            }
                            size="small"
                            sx={{
                              bgcolor:
                                VERDICT_TYPES[
                                  value as keyof typeof VERDICT_TYPES
                                ]?.color,
                              color: '#fff',
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {Object.entries(VERDICT_TYPES).map(
                      ([key, { label, icon }]) => (
                        <MenuItem key={key} value={key}>
                          {icon} {label}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                  color: '#ff6666',
                }}
              >
                <ReportProblemIcon /> ТОП-6 самых опасных видео
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  overflowX: 'auto',
                  gap: 3,
                  pb: 3,
                  mb: 5,
                }}
              >
                {topRiskyVideos.map((video) => {
                  const dangerPercent = 100 - (video.safety_percent || 0)
                  return (
                    <motion.div
                      key={video.id}
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      style={{ flex: '0 0 auto', width: 260 }}
                    >
                      <Card
                        onClick={() => handleVideoClick(video)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: 'rgba(20,20,40,0.8)',
                          backdropFilter: 'blur(12px)',
                          borderRadius: 4,
                          border: `1px solid ${video.is_dangerous ? '#ff3366' : '#33ffcc'}`,
                          overflow: 'hidden',
                          transition: '0.2s',
                        }}
                      >
                        <Box
                          sx={{
                            height: 140,
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          {video.preview_image_url ? (
                            <img
                              src={video.preview_image_url}
                              alt={video.title || ''}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: '100%',
                                height: '100%',
                                bgcolor: '#111',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography variant="caption">
                                Нет превью
                              </Typography>
                            </Box>
                          )}
                          <Chip
                            label={`ОПАСНОСТЬ ${Math.round(dangerPercent)}%`}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: video.is_dangerous
                                ? '#ff3366'
                                : '#33ffcc',
                              fontWeight: 'bold',
                            }}
                          />
                        </Box>
                        <Box sx={{ p: 2 }}>
                          <Typography
                            variant="body1"
                            fontWeight="bold"
                            noWrap
                            sx={{ color: '#fff' }}
                          >
                            {video.title || 'Без названия'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#aaa' }}>
                            {video.userId ? `ID: ${video.userId}` : 'Аноним'} •{' '}
                            {new Date(video.checked_at).toLocaleDateString()}
                          </Typography>
                          <Box
                            sx={{
                              mt: 1,
                              display: 'flex',
                              gap: 0.5,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Chip
                              label={
                                VERDICT_TYPES[video.verdict_text]?.label ||
                                video.verdict_text
                              }
                              size="small"
                              sx={{
                                bgcolor:
                                  VERDICT_TYPES[video.verdict_text]?.color ||
                                  '#aaa',
                                color: '#fff',
                                fontSize: '0.65rem',
                              }}
                            />
                          </Box>
                        </Box>
                      </Card>
                    </motion.div>
                  )
                })}
              </Box>
              <Typography
                variant="h5"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                  color: '#88f',
                }}
              >
                <AccessTimeIcon /> Последние выявленные угрозы
              </Typography>
              <Card
                sx={{
                  bgcolor: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 3,
                  mb: 5,
                }}
              >
                <List>
                  <AnimatePresence>
                    {recentThreats.map((threat, idx) => {
                      const dangerPercent = 100 - (threat.safety_percent || 0)
                      return (
                        <motion.div
                          key={threat.id}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <ListItem
                            button
                            onClick={() => handleVideoClick(threat)}
                          >
                            <ListItemAvatar>
                              <Avatar
                                src={threat.preview_image_url || undefined}
                                variant="rounded"
                              >
                                {!threat.preview_image_url && (
                                  <VideoLibraryIcon />
                                )}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={threat.title || 'Без названия'}
                              secondary={`Дата: ${new Date(threat.checked_at).toLocaleString()} • Опасность: ${Math.round(dangerPercent)}%`}
                              primaryTypographyProps={{ color: '#fff' }}
                              secondaryTypographyProps={{ color: '#aaa' }}
                            />
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                              }}
                            >
                              <LinearProgress
                                variant="determinate"
                                value={dangerPercent}
                                sx={{ width: 80, height: 6, borderRadius: 3 }}
                              />
                              <Chip
                                label={`${Math.round(dangerPercent)}%`}
                                size="small"
                                sx={{ bgcolor: '#ff3366', color: '#fff' }}
                              />
                            </Box>
                          </ListItem>
                          <Divider
                            variant="inset"
                            sx={{ borderColor: '#333' }}
                          />
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </List>
              </Card>

              {/* Спидометр + круговая диаграмма */}
              <Grid container spacing={4} sx={{ mb: 5 }}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Card
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 3,
                      p: 2,
                      border: '1px solid #33ffcc',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        color: '#0ff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <AnalyticsIcon /> Уровень опасности (последние 7 дней)
                    </Typography>
                    <CyberSpeedometer
                      value={dangerLevel}
                      label="Опасность"
                      size={250}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 3,
                        mt: 2,
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Всего проверок:{' '}
                        <strong style={{ color: '#fff' }}>
                          {filteredThreats.length}
                        </strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Опасных:{' '}
                        <strong style={{ color: '#ff3366' }}>
                          {filteredThreats.filter((t) => t.is_dangerous).length}
                        </strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Безопасных:{' '}
                        <strong style={{ color: '#33ffcc' }}>
                          {
                            filteredThreats.filter(
                              (t) =>
                                !t.is_dangerous && t.verdict_text === 'safe'
                            ).length
                          }
                        </strong>
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Card
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 3,
                      p: 2,
                      border: '1px solid #ffaa44',
                      height: '100%',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        color: '#ffaa44',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <PieChartIcon /> Распределение вердиктов
                    </Typography>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={verdictStats}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {verdictStats.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Grid>
              </Grid>

              {/* Инфографика */}
              <Grid container spacing={4} sx={{ mb: 5 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 4,
                      height: '100%',
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="180"
                      image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600"
                      alt="Как это работает"
                    />
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#0ff',
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <SearchIcon /> Как это работает?
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ddd' }}>
                        AI Media Watch анализирует видео в 3 этапа: 1)
                        Извлечение ключевых кадров, аудио и текста (OCR). 2)
                        Детекция визуальных маркеров казино/пирамид (YOLO),
                        транскрибация речи (Whisper), поиск запрещённых фраз
                        (NLP). 3) Вынесение вердикта и объяснение риска.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 4,
                      height: '100%',
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="180"
                      image="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600"
                      alt="Почему это важно?"
                    />
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#0ff',
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <WarningIcon /> Почему это важно?
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ddd' }}>
                        Ежедневно тысячи пользователей попадаются на уловки
                        мошенников в соцсетях: фейковые казино, финансовые
                        пирамиды, реферальные схемы. Наш AI помогает выявлять
                        такие угрозы до того, как они нанесут вред.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 4,
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image="https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400"
                      alt="Типичные схемы"
                    />
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: '#ffaa44',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <CasinoIcon /> Нелегальные казино
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ddd' }}>
                        Обещают лёгкий выигрыш, но на деле выводят деньги.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 4,
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image="https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400"
                      alt="Финансовые пирамиды"
                    />
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: '#ffaa44',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <TrendingUpIcon /> Финансовые пирамиды
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ddd' }}>
                        «Инвестируй 1000, получи 10000» — классическая схема
                        Понци.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 4,
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400"
                      alt="Реферальные схемы"
                    />
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: '#ffaa44',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <LinkIcon /> Реферальные схемы
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ddd' }}>
                        Заработок только на привлечении новых жертв без
                        реального продукта.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
          <Box
            sx={{
              textAlign: 'center',
              mt: 2,
              p: 3,
              borderRadius: 3,
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: '#0ff',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <SecurityIcon /> Как защитить себя от мошенничества?
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#ddd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CheckCircleIcon sx={{ color: '#33ffcc', fontSize: 18 }} /> Не
                  переходите по подозрительным ссылкам
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#ddd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CheckCircleIcon sx={{ color: '#33ffcc', fontSize: 18 }} />{' '}
                  Проверяйте отзывы о казино/инвестициях
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#ddd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CheckCircleIcon sx={{ color: '#33ffcc', fontSize: 18 }} /> Не
                  доверяйте гарантированному доходу
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#ddd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CheckCircleIcon sx={{ color: '#33ffcc', fontSize: 18 }} />{' '}
                  Используйте наш AI для проверки видео
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* ========== МОДАЛЬНОЕ ОКНО С ДЕТАЛЯМИ ВИДЕО ========== */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(5,5,20,0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,255,255,0.3)',
            boxShadow: '0 0 40px rgba(0,255,255,0.2)',
            borderRadius: 4,
            color: '#fff',
            overflow: 'hidden',
          },
        }}
      >
        {selectedVideo && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(0,255,255,0.2)',
                pb: 2,
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', color: '#0ff' }}
              >
                Детали проверки
              </Typography>
              <IconButton
                onClick={() => setModalOpen(false)}
                sx={{ color: '#0ff' }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {/* Превью */}
              {selectedVideo.preview_image_url ? (
                <Box
                  component="img"
                  src={selectedVideo.preview_image_url}
                  alt={selectedVideo.title || 'Превью'}
                  sx={{
                    width: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: 2,
                    mb: 2,
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: 120,
                    bgcolor: '#111',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    border: '1px solid #333',
                  }}
                >
                  <VideoLibraryIcon sx={{ fontSize: 48, color: '#555' }} />
                </Box>
              )}

              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                {selectedVideo.title || 'Без названия'}
              </Typography>

              <TableContainer
                component={TablePaper}
                sx={{ bgcolor: 'transparent', boxShadow: 'none' }}
              >
                <Table size="medium">
                  <TableBody>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: '#0ff',
                          fontWeight: 'bold',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        Вердикт
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        {getVerdictChip(selectedVideo.verdict_text)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: '#0ff',
                          fontWeight: 'bold',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        Опасность
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        {selectedVideo.is_dangerous ? '⚠️ Да' : '✅ Нет'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: '#0ff',
                          fontWeight: 'bold',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        Безопасность, %
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        {selectedVideo.safety_percent}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: '#0ff',
                          fontWeight: 'bold',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        Длительность
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        {selectedVideo.duration_seconds} сек.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: '#0ff',
                          fontWeight: 'bold',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        Дата проверки
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        {new Date(selectedVideo.checked_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: '#0ff',
                          fontWeight: 'bold',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        Инициатор
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        {selectedVideo.userId
                          ? `ID: ${selectedVideo.userId}`
                          : 'Аноним'}
                      </TableCell>
                    </TableRow>
                    {selectedVideo.tags && (
                      <TableRow>
                        <TableCell
                          sx={{
                            color: '#0ff',
                            fontWeight: 'bold',
                            borderBottom: '1px solid rgba(0,255,255,0.1)',
                          }}
                        >
                          Теги
                        </TableCell>
                        <TableCell
                          sx={{
                            color: '#fff',
                            borderBottom: '1px solid rgba(0,255,255,0.1)',
                          }}
                        >
                          {selectedVideo.tags.split(',').map((tag, i) => (
                            <Chip
                              key={i}
                              label={tag.trim()}
                              size="small"
                              sx={{ bgcolor: '#333', color: '#fff', mr: 0.5 }}
                            />
                          ))}
                        </TableCell>
                      </TableRow>
                    )}
                    {selectedVideo.reason && (
                      <TableRow>
                        <TableCell
                          sx={{
                            color: '#0ff',
                            fontWeight: 'bold',
                            borderBottom: '1px solid rgba(0,255,255,0.1)',
                          }}
                        >
                          Обоснование
                        </TableCell>
                        <TableCell
                          sx={{
                            color: '#ddd',
                            borderBottom: '1px solid rgba(0,255,255,0.1)',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {selectedVideo.reason}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                        Ссылка
                      </TableCell>
                      <TableCell>
                        <Link
                          href={selectedVideo.video_url}
                          target="_blank"
                          sx={{
                            color: '#0ff',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          Открыть видео
                        </Link>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions
              sx={{ borderTop: '1px solid rgba(0,255,255,0.2)', p: 2 }}
            >
              <Button
                onClick={() => setModalOpen(false)}
                variant="contained"
                sx={{
                  bgcolor: '#0ff',
                  color: '#000',
                  '&:hover': { bgcolor: '#33ffcc' },
                }}
              >
                Закрыть
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default CyberMediaWatchPro
