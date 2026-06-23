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
  TableHead,
  type SelectChangeEvent,
  Tooltip,
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
import SecurityIcon from '@mui/icons-material/Security'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import YouTubeIcon from '@mui/icons-material/YouTube'
import InstagramIcon from '@mui/icons-material/Instagram'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import CloseIcon from '@mui/icons-material/Close'
import HelpIcon from '@mui/icons-material/Help'
import CasinoIcon from '@mui/icons-material/Casino'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import LeaderboardIcon from '@mui/icons-material/Leaderboard'
import TelegramIcon from '@mui/icons-material/Telegram'

import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
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
import {
  $host,
  getVideoAnalyses,
  VideoAnalysis,
  createAnalysisJob,
} from '../http/API'

const FloatingShapes = () => {
  const groupRef = useRef<THREE.Group>(null!)

  const shapes = useMemo(() => {
    const geometries = [
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.SphereGeometry(0.6, 32, 32),
      new THREE.TorusGeometry(0.5, 0.2, 16, 32),
      new THREE.OctahedronGeometry(0.7),
      new THREE.IcosahedronGeometry(0.6),
    ]
    const colors = ['#ff3366', '#33ffcc', '#ffaa44', '#aa66ff', '#44ff66']
    const positions = [
      [-3, 2, -5],
      [4, -1, -7],
      [2, 3, -10],
      [-4, -2, -8],
      [1, 4, -12],
    ]
    const speeds = [0.3, 0.2, 0.4, 0.25, 0.35]
    return geometries.map((geo, idx) => ({
      geometry: geo,
      color: colors[idx % colors.length],
      startX: positions[idx][0],
      startY: positions[idx][1],
      startZ: positions[idx][2],
      speed: speeds[idx],
      ampX: 2.0 + Math.random() * 2.0,
      ampY: 1.5 + Math.random() * 1.5,
      ampZ: 1.0 + Math.random() * 1.5,
      freqX: 0.1 + Math.random() * 0.1,
      freqY: 0.1 + Math.random() * 0.1,
      freqZ: 0.1 + Math.random() * 0.1,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      phaseZ: Math.random() * Math.PI * 2,
      rotSpeedX: 0.003 + Math.random() * 0.005,
      rotSpeedY: 0.003 + Math.random() * 0.005,
      rotSpeedZ: 0.003 + Math.random() * 0.005,
    }))
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.children.forEach((child, idx) => {
        const shape = shapes[idx]
        if (!shape) return
        const x =
          shape.startX + shape.ampX * Math.sin(shape.freqX * t + shape.phaseX)
        const y =
          shape.startY + shape.ampY * Math.sin(shape.freqY * t + shape.phaseY)
        const z =
          shape.startZ + shape.ampZ * Math.sin(shape.freqZ * t + shape.phaseZ)
        child.position.set(x, y, z)
        child.rotation.x += shape.rotSpeedX
        child.rotation.y += shape.rotSpeedY
        child.rotation.z += shape.rotSpeedZ
      })
    }
  })

  return (
    <group ref={groupRef}>
      {shapes.map((shape, idx) => (
        <mesh key={idx} position={[shape.startX, shape.startY, shape.startZ]}>
          <primitive object={shape.geometry} attach="geometry" />
          <meshStandardMaterial
            color={shape.color}
            emissive={shape.color}
            emissiveIntensity={0.3}
            metalness={0.4}
            roughness={0.3}
            transparent
            opacity={0.9}
          />
        </mesh>
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
        <FloatingShapes />
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

const CyberMediaWatchPro = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [checkResultMessage, setCheckResultMessage] = useState<string | null>(
    null
  )
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'all'>(
    'week'
  )
  const [selectedVerdictFilter, setSelectedVerdictFilter] = useState<string[]>(
    []
  )
  const [videoAnalyses, setVideoAnalyses] = useState<VideoAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoAnalysis | null>(null)
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string[]>([])
  const isAdmin = user?.role === 'ADMIN'
  const { t, i18n } = useTranslation()
  const langs = [
    { v: 'ru', l: t('lang_ru') },
    { v: 'en', l: t('lang_en') },
    { v: 'kz', l: t('lang_kz') },
  ]
  const handleLanguageChange = (e: SelectChangeEvent<string>) => {
    i18n.changeLanguage(e.target.value)
  }

  const VERDICT_TYPES = {
    safe: {
      label: t('bezopasno'),
      color: '#33ffcc',
      icon: <CheckCircleIcon sx={{ fontSize: 16, color: '#33ffcc' }} />,
    },
    dangerous: {
      label: t('opasno'),
      color: '#ff3366',
      icon: <WarningIcon sx={{ fontSize: 16, color: '#ff3366' }} />,
    },
    uncertain: {
      label: t('neopredely'),
      color: '#ffaa44',
      icon: <HelpIcon sx={{ fontSize: 16, color: '#ffaa44' }} />,
    },
  }

  const RISK_TYPES = {
    казино: {
      label: t('kazino'),
      color: '#ff3366',
      icon: <CasinoIcon sx={{ fontSize: 16, color: '#ff3366' }} />,
    },
    пирамида: {
      label: t('piramida'),
      color: '#ffaa44',
      icon: <AccountTreeIcon sx={{ fontSize: 16, color: '#ffaa44' }} />,
    },
    инвестиции: {
      label: t('investicii'),
      color: '#ffaa44',
      icon: <ShowChartIcon sx={{ fontSize: 16, color: '#ffaa44' }} />,
    },
    крипто: {
      label: t('kripto'),
      color: '#ffaa44',
      icon: <CurrencyBitcoinIcon sx={{ fontSize: 16, color: '#ffaa44' }} />,
    },
    рефералы: {
      label: t('referaly'),
      color: '#ffaa44',
      icon: <PeopleAltIcon sx={{ fontSize: 16, color: '#ffaa44' }} />,
    },
    понци: {
      label: t('ponci'),
      color: '#ffaa44',
      icon: <WarningAmberIcon sx={{ fontSize: 16, color: '#ffaa44' }} />,
    },
  }

  const [loginModalOpen, setLoginModalOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoginModalOpen(true)
    }
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getVideoAnalyses({ limit: 1000, offset: 0 })
      setVideoAnalyses(response.data)
    } catch (err: any) {
      console.error('Ошибка загрузки видеоанализов:', err)
      setError('Ошибка')
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
    if (selectedRiskFilter.length > 0) {
      threats = threats.filter((t) =>
        selectedRiskFilter.includes(t.primary_risk || '')
      )
    }
    return threats
  }, [videoAnalyses, timeframe, selectedVerdictFilter, selectedRiskFilter])

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
    const totalVideos = filteredThreats.length
    const dangerousCount = filteredThreats.filter((v) => v.is_dangerous).length
    const dangerousAuthors = new Set(
      filteredThreats
        .filter((v) => v.is_dangerous && v.uploader)
        .map((v) => v.uploader)
    )
    const platforms = new Set(
      filteredThreats.map((v) => {
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
      dangerousAuthorsCount: dangerousAuthors.size,
      platformsCount: platforms.size,
    }
  }, [filteredThreats])

  const authorLeaderboard = useMemo(() => {
    const map = new Map<
      string,
      { total: number; dangerous: number; risks: string[] }
    >()
    filteredThreats.forEach((v) => {
      const key = v.uploader || 'Аноним'
      if (!map.has(key)) {
        map.set(key, { total: 0, dangerous: 0, risks: [] })
      }
      const entry = map.get(key)!
      entry.total += 1
      if (v.is_dangerous) entry.dangerous += 1
      if (v.primary_risk) entry.risks.push(v.primary_risk)
    })

    const result = Array.from(map.entries())
      .filter(([_, data]) => data.dangerous > 0)
      .map(([author, data]) => {
        const dangerPercent =
          data.total > 0 ? (data.dangerous / data.total) * 100 : 0
        const riskCounts: Record<string, number> = {}
        data.risks.forEach((r) => {
          riskCounts[r] = (riskCounts[r] || 0) + 1
        })
        let topRisk = ''
        let maxCount = 0
        Object.entries(riskCounts).forEach(([r, c]) => {
          if (c > maxCount) {
            maxCount = c
            topRisk = r
          }
        })
        return {
          author,
          total: data.total,
          dangerous: data.dangerous,
          dangerPercent: Math.round(dangerPercent),
          topRisk,
        }
      })

    result.sort(
      (a, b) => b.dangerous - a.dangerous || b.dangerPercent - a.dangerPercent
    )
    return result.slice(0, 5)
  }, [filteredThreats])

  const handleCheckVideo = async () => {
    if (!videoUrl.trim()) return
    setIsChecking(true)
    try {
      const response = await $host.post('/analysis-queue', {
        url: videoUrl,
      })
      setCheckResultMessage(
        `[OK] ${response.data.message || 'Видео добавлено в очередь обработки'}`
      )
    } catch (error: any) {
      console.error('Ошибка при добавлении в очередь:', error)
      const errorMsg =
        error.response?.data?.message || 'Не удалось добавить видео в очередь'
      setCheckResultMessage(`[Ошибка] ${errorMsg}`)
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

  const getVerdictChip = (verdict: string) => {
    const map = {
      safe: { label: <>{t('bezopasno')}</>, color: '#44ff66' },
      dangerous: { label: <>{t('opasno')}</>, color: '#ff3366' },
      uncertain: { label: <>{t('neopredely')}</>, color: '#ffaa44' },
    }
    const info = map[verdict as keyof typeof map] || map.uncertain
    return (
      <Chip
        label={info.label}
        sx={{ bgcolor: info.color, color: '#ffffff', fontWeight: 'bold' }}
      />
    )
  }

  const TELEGRAM_BOT_URL = 'https://t.me/AMWPro_Bot'

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
            top: 12,
            right: 16,
            zIndex: 1200,
            bgcolor: 'rgba(0,0,0,0.5)',
            borderRadius: 2,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
          }}
        >
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#aaa' }}>{t('trans.title')}</InputLabel>
            <Select
              value={i18n.language}
              label={t('trans.title')}
              onChange={handleLanguageChange}
              sx={{
                color: 'white',
                minWidth: 140,
                '& .MuiSelect-icon': { color: 'white' },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#777',
                },
              }}
            >
              {langs.map((lang) => (
                <MenuItem key={lang.v} value={lang.v}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img
                      height={15}
                      src={`/images/flags/${lang.v}.svg`}
                      alt={lang.l}
                      style={{ marginRight: 5 }}
                    />
                    {lang.l}
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
              <SecurityIcon /> {t('monitoring')}
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
                    checkResultMessage.startsWith('[OK]')
                      ? 'success'
                      : 'warning'
                  }
                  sx={{
                    mb: 3,
                    borderRadius: 4,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    border: `1px solid ${checkResultMessage.startsWith('[OK]') ? '#44ff66' : '#ff3366'}`,
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
                <LinkIcon /> {t('analiz-vid')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  placeholder={t('vstavte-ss')}
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
                    <>{t('proverit')}</>
                  )}
                </Button>
              </Box>
              <Typography
                variant="caption"
                sx={{ mt: 1, color: '#aaa', display: 'block' }}
              >
                {t('multimodal')}
              </Typography>

              <Divider sx={{ my: 2, borderColor: 'rgba(0,255,255,0.2)' }} />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<TelegramIcon />}
                    onClick={() => window.open(TELEGRAM_BOT_URL, '_blank')}
                    sx={{
                      borderColor: '#0ff',
                      color: '#0ff',
                      borderRadius: 30,
                      px: 3,
                      '&:hover': {
                        bgcolor: 'rgba(0,255,255,0.15)',
                        borderColor: '#33ffcc',
                        boxShadow: '0 0 20px rgba(0,255,255,0.3)',
                      },
                    }}
                  >
                    {t('pereiti-v-')}
                  </Button>
                </Box>

                <Tooltip title="Отсканируйте QR-код, чтобы открыть бота" arrow>
                  <Box
                    component="a"
                    target="_blank"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: '#0ff',
                      cursor: 'pointer',
                      transition: '0.2s',
                      '&:hover': {
                        filter: 'drop-shadow(0 0 10px #0ff)',
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src="/images/AMWPro.png"
                      alt="QR-код для Telegram бота AMWPro"
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: 3,
                        border: '1px solid rgba(0,255,255,0.3)',
                        backgroundColor: '#fff',
                        p: 0.5,
                        alignItems: 'center',
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: '#aaa', mt: 0.5 }}
                    >
                      AMWPro
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
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
                    label: <>{t('video-obra')}</>,
                    value: stats.totalVideos,
                    color: '#33ffcc',
                  },
                  {
                    icon: <WarningIcon />,
                    label: <>{t('ugroz-vyya')}</>,
                    value: stats.dangerousCount,
                    color: '#ff3366',
                  },
                  {
                    icon: <TrendingUpIcon />,
                    label: <>{t('opasnykh-a')}</>,
                    value: stats.dangerousAuthorsCount,
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
                          {t('platformy-')}
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
                  <ToggleButton value="day">{t('den')}</ToggleButton>
                  <ToggleButton value="week">{t('nedelya')}</ToggleButton>
                  <ToggleButton value="month">{t('mesyac')}</ToggleButton>
                  <ToggleButton value="all">{t('vsyo-vremy')}</ToggleButton>
                </ToggleButtonGroup>
                <FormControl
                  size="small"
                  sx={{
                    minWidth: 200,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    borderRadius: 2,
                  }}
                >
                  <InputLabel sx={{ color: '#0ff' }}>{t('verdikt')}</InputLabel>
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
                <FormControl
                  size="small"
                  sx={{
                    minWidth: 180,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    borderRadius: 2,
                  }}
                >
                  <InputLabel sx={{ color: '#ffaa44' }}>
                    {t('osnovnoi-r')}
                  </InputLabel>
                  <Select
                    multiple
                    value={selectedRiskFilter}
                    onChange={(e) =>
                      setSelectedRiskFilter(
                        typeof e.target.value === 'string'
                          ? e.target.value.split(',')
                          : e.target.value
                      )
                    }
                    label="Основной риск"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={
                              RISK_TYPES[value as keyof typeof RISK_TYPES]
                                ?.label || value
                            }
                            size="small"
                            sx={{
                              bgcolor:
                                RISK_TYPES[value as keyof typeof RISK_TYPES]
                                  ?.color || '#ffaa44',
                              color: '#fff',
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {Object.entries(RISK_TYPES).map(
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
                <ReportProblemIcon /> {t('top-6-samy')}
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
                                {t('net-prevyu')}
                              </Typography>
                            </Box>
                          )}
                          <Chip
                            label={`${t('opasnost-0')} ${Math.round(dangerPercent)}%`}
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
                            {video.title || <>{t('bez-nazvan')}</>}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#aaa' }}>
                            {video.userId ? (
                              `ID: ${video.userId}`
                            ) : (
                              <>{t('anonim')}</>
                            )}{' '}
                            • {new Date(video.checked_at).toLocaleDateString()}
                          </Typography>
                          <Box
                            sx={{
                              mt: 1,
                              display: 'flex',
                              gap: 0.5,
                              flexWrap: 'wrap',
                            }}
                          >
                            {video.primary_risk && (
                              <Chip
                                icon={
                                  RISK_TYPES[
                                    video.primary_risk as keyof typeof RISK_TYPES
                                  ]?.icon
                                }
                                label={
                                  RISK_TYPES[
                                    video.primary_risk as keyof typeof RISK_TYPES
                                  ]?.label || video.primary_risk
                                }
                                size="small"
                                sx={{
                                  bgcolor:
                                    RISK_TYPES[
                                      video.primary_risk as keyof typeof RISK_TYPES
                                    ]?.color || '#ffaa44',
                                  color: '#fff',
                                  fontSize: '0.65rem',
                                }}
                              />
                            )}
                            <Chip
                              icon={VERDICT_TYPES[video.verdict_text]?.icon}
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
                <AccessTimeIcon /> {t('poslednie-')}
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
                              primary={
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <span>
                                    {threat.title || <>{t('bez-nazvan')}</>}
                                  </span>
                                  {threat.primary_risk && (
                                    <Chip
                                      label={
                                        RISK_TYPES[
                                          threat.primary_risk as keyof typeof RISK_TYPES
                                        ]?.label || threat.primary_risk
                                      }
                                      size="small"
                                      sx={{
                                        bgcolor:
                                          RISK_TYPES[
                                            threat.primary_risk as keyof typeof RISK_TYPES
                                          ]?.color || '#ffaa44',
                                        color: '#fff',
                                        fontSize: '0.6rem',
                                        height: 20,
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={`${t('data')}: ${new Date(threat.checked_at).toLocaleString()} • ${t('opasnost')}
                              : ${Math.round(dangerPercent)}%`}
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
                      <AnalyticsIcon /> {t('uroven-opa')}
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
                        {t('vsego-prov')}:{' '}
                        <strong style={{ color: '#fff' }}>
                          {filteredThreats.length}
                        </strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        {t('opasnykh')}:{' '}
                        <strong style={{ color: '#ff3366' }}>
                          {filteredThreats.filter((t) => t.is_dangerous).length}
                        </strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        {t('bezopasnyk')}:{' '}
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
                      <PieChartIcon /> {t('raspredele')}
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

              {authorLeaderboard.length > 0 && (
                <Box sx={{ mb: 5 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                      color: '#ffaa44',
                    }}
                  >
                    <LeaderboardIcon /> {t('liderbord-')}
                  </Typography>
                  <Card
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 3,
                      border: '1px solid #ffaa44',
                      overflow: 'hidden',
                    }}
                  >
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'rgba(255,170,68,0.1)' }}>
                            <TableCell
                              sx={{ color: '#ffaa44', fontWeight: 'bold' }}
                            >
                              #
                            </TableCell>
                            <TableCell
                              sx={{ color: '#ffaa44', fontWeight: 'bold' }}
                            >
                              {t('kanal')}
                            </TableCell>
                            <TableCell
                              sx={{ color: '#ffaa44', fontWeight: 'bold' }}
                              align="center"
                            >
                              {t('opasnykh')}
                            </TableCell>
                            <TableCell
                              sx={{ color: '#ffaa44', fontWeight: 'bold' }}
                              align="center"
                            >
                              {t('vsego')}
                            </TableCell>
                            <TableCell
                              sx={{ color: '#ffaa44', fontWeight: 'bold' }}
                              align="center"
                            >
                              % {t('opasnosti')}
                            </TableCell>
                            <TableCell
                              sx={{ color: '#ffaa44', fontWeight: 'bold' }}
                              align="center"
                            >
                              {t('osnovnoi-r')}
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {authorLeaderboard.map((item, index) => (
                            <TableRow
                              key={item.author}
                              sx={{
                                '&:hover': { bgcolor: 'rgba(255,170,68,0.05)' },
                                borderBottom: '1px solid rgba(255,170,68,0.1)',
                              }}
                            >
                              <TableCell
                                sx={{ color: '#fff', fontWeight: 'bold' }}
                              >
                                {index + 1}
                              </TableCell>
                              <TableCell sx={{ color: '#fff' }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      bgcolor: '#ffaa44',
                                    }}
                                  >
                                    {item.author.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <span>{item.author}</span>
                                </Box>
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ color: '#ff3366', fontWeight: 'bold' }}
                              >
                                {item.dangerous}
                              </TableCell>
                              <TableCell align="center" sx={{ color: '#fff' }}>
                                {item.total}
                              </TableCell>
                              <TableCell align="center">
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <LinearProgress
                                    variant="determinate"
                                    value={item.dangerPercent}
                                    sx={{
                                      width: 60,
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: '#333',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor:
                                          item.dangerPercent > 70
                                            ? '#ff3366'
                                            : '#ffaa44',
                                      },
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{ color: '#aaa' }}
                                  >
                                    {item.dangerPercent}%
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                {item.topRisk ? (
                                  <Chip
                                    label={
                                      RISK_TYPES[
                                        item.topRisk as keyof typeof RISK_TYPES
                                      ]?.label || item.topRisk
                                    }
                                    size="small"
                                    sx={{
                                      bgcolor:
                                        RISK_TYPES[
                                          item.topRisk as keyof typeof RISK_TYPES
                                        ]?.color || '#ffaa44',
                                      color: '#fff',
                                      fontSize: '0.65rem',
                                    }}
                                  />
                                ) : (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: '#666' }}
                                  >
                                    —
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </Box>
              )}

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
                        <SearchIcon /> {t('kak-eto-ra')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ddd' }}>
                        {t('ai-media-w')}
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
                        <WarningIcon /> {t('pochemu-et')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ddd' }}>
                        {t('ezhednevno')}
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
                        <CasinoIcon /> {t('nelegalnye')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ddd' }}>
                        {t('obeshayut-')}
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
                        <TrendingUpIcon /> {t('finansovye')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ddd' }}>
                        {t('investirui')}
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
                        <LinkIcon /> {t('referalnye')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ddd' }}>
                        {t('zarabotok-')}
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
              <SecurityIcon /> {t('kak-zashit')}
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
                  {t('perekhodit')}
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
                  {t('proveryait')}
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
                  {t('doveryaite')}
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
                  {t('ispolzuite')}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>

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
                {t('detali-pro')}
              </Typography>
              <IconButton
                onClick={() => setModalOpen(false)}
                sx={{ color: '#0ff' }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
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
                        {t('osnovnoi-r')}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        {selectedVideo.primary_risk ? (
                          <Chip
                            label={
                              RISK_TYPES[
                                selectedVideo.primary_risk as keyof typeof RISK_TYPES
                              ]?.label || selectedVideo.primary_risk
                            }
                            size="small"
                            sx={{
                              bgcolor:
                                RISK_TYPES[
                                  selectedVideo.primary_risk as keyof typeof RISK_TYPES
                                ]?.color || '#ffaa44',
                              color: '#fff',
                            }}
                          />
                        ) : (
                          <>{t('ne-opredel')}</>
                        )}
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
                        {t('verdikt')}
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
                        {t('opasnost')}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        {selectedVideo.is_dangerous ? (
                          <>{t('da')}</>
                        ) : (
                          <>{t('net')}</>
                        )}
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
                        {t('dlitelnost')}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          borderBottom: '1px solid rgba(0,255,255,0.1)',
                        }}
                      >
                        {selectedVideo.duration_seconds} {t('sekund')}
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
                        {t('data-prove')}
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
                    {selectedVideo.tags && (
                      <TableRow>
                        <TableCell
                          sx={{
                            color: '#0ff',
                            fontWeight: 'bold',
                            borderBottom: '1px solid rgba(0,255,255,0.1)',
                          }}
                        >
                          {t('tegi')}
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
                          {t('obosnovani')}
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
                        {t('ssylka')}
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
                          {t('otkryt-vid')}
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
                {t('zakryt')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(10,10,30,0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,255,255,0.4)',
            borderRadius: 4,
            color: '#fff',
            p: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: '#0ff', textAlign: 'center' }}>
          🔐 Войдите в аккаунт
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            sx={{ color: '#ddd', textAlign: 'center', mb: 2 }}
          >
            Войдите, чтобы сохранять историю проверок и получать
            персонализированные рекомендации.
            <br />
            <span style={{ color: '#aaa' }}>
              Вы можете продолжить как гость.
            </span>
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              onClick={() => {
                setLoginModalOpen(false)
                navigate('/login')
              }}
              sx={{
                bgcolor: '#0ff',
                color: '#000',
                '&:hover': { bgcolor: '#33ffcc' },
              }}
            >
              Войти
            </Button>
            <Button
              variant="outlined"
              onClick={() => setLoginModalOpen(false)}
              sx={{
                borderColor: '#0ff',
                color: '#0ff',
                '&:hover': { bgcolor: 'rgba(0,255,255,0.1)' },
              }}
            >
              Продолжить как гость
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <IconButton
            onClick={() => setLoginModalOpen(false)}
            sx={{ color: '#666' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CyberMediaWatchPro
