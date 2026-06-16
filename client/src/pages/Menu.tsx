import React, { useState, useRef, useMemo } from 'react'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import WarningIcon from '@mui/icons-material/Warning'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import LinkIcon from '@mui/icons-material/Link'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
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
  LineChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUser } from '../context/user/useUser'
import CyberSidebar from '../components/CyberSidebar'
import { $host } from '../http/API'

// ---------- 3D фон ----------
const FloatingIconsOnly = () => {
  const groupRef = useRef<THREE.Group>(null!)
  const elements = useMemo(
    () => [
      {
        symbol: '📱',
        color: '#00f2ea',
        size: 1.4,
        startX: -3,
        startY: 1.5,
        startZ: -2,
      },
      {
        symbol: '📸',
        color: '#e4405f',
        size: 1.4,
        startX: 4,
        startY: -1.5,
        startZ: -1.5,
      },
      {
        symbol: '▶️',
        color: '#ff0000',
        size: 1.4,
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

const RISK_TYPES = [
  { id: 'casino', name: 'Нелегальное казино', color: '#ff3366', icon: '🎰' },
  { id: 'pyramid', name: 'Финансовая пирамида', color: '#ffaa44', icon: '📈' },
  { id: 'gambling', name: 'Азарт без лицензии', color: '#ff8844', icon: '🃏' },
  {
    id: 'guaranteed',
    name: 'Гарантированный доход',
    color: '#ff6666',
    icon: '💰',
  },
  { id: 'referral', name: 'Реферальная схема', color: '#ff9966', icon: '🔗' },
  {
    id: 'crypto_scam',
    name: 'Крипто-мошенничество',
    color: '#ff44aa',
    icon: '₿',
  },
]

const generateMockThreats = (count: number) => {
  const platforms = ['tiktok', 'instagram', 'youtube']
  const authors = [
    'fastmoney.kz',
    'invest_guru',
    'casino_hacker',
    'mlm_king',
    'slot_machine',
    'crypto_guru',
    'profit_daily',
    'wealth_secret',
  ]
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Угроза ${i + 1}: ${['Заработай 500%', 'Инвестируй 1000→10000', 'Секрет казино', 'Пассивный доход', 'Крути барабан', 'Крипто-халява'][i % 6]}`,
    author: authors[i % authors.length],
    platform: platforms[i % 3],
    riskScore: 0.6 + Math.random() * 0.35,
    riskTypes: [
      RISK_TYPES[Math.floor(Math.random() * RISK_TYPES.length)],
      RISK_TYPES[Math.floor(Math.random() * RISK_TYPES.length)],
    ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i),
    thumbnail: `https://picsum.photos/id/${200 + i}/200/150`,
    processedAt: new Date(
      Date.now() - Math.random() * 7 * 86400000
    ).toISOString(),
    views: Math.floor(10000 + Math.random() * 100000),
    comments: Math.floor(100 + Math.random() * 5000),
  }))
}

const allMockThreats = generateMockThreats(48)

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
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string[]>([])
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportedUrl, setReportedUrl] = useState('')
  const [reportSuccess, setReportSuccess] = useState(false)

  const isAdmin = user?.role === 'ADMIN'
  const { i18n } = useTranslation()

  const filteredThreats = useMemo(() => {
    let threats = [...allMockThreats]
    const now = new Date()
    if (timeframe === 'day')
      threats = threats.filter(
        (t) => new Date(t.processedAt) > new Date(now.getTime() - 24 * 3600000)
      )
    else if (timeframe === 'week')
      threats = threats.filter(
        (t) => new Date(t.processedAt) > new Date(now.getTime() - 7 * 86400000)
      )
    if (selectedRiskFilter.length > 0)
      threats = threats.filter((t) =>
        t.riskTypes.some((rt) => selectedRiskFilter.includes(rt.id))
      )
    return threats
  }, [timeframe, selectedRiskFilter])

  const riskTypeStats = useMemo(() => {
    const stats: Record<string, number> = {}
    filteredThreats.forEach((t) =>
      t.riskTypes.forEach((rt) => (stats[rt.name] = (stats[rt.name] || 0) + 1))
    )
    return Object.entries(stats).map(([name, value]) => ({
      name,
      value,
      color: RISK_TYPES.find((r) => r.name === name)?.color || '#fff',
    }))
  }, [filteredThreats])

  const trendByDay = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        date: d.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
        }),
        count: 0,
      }
    })
    filteredThreats.forEach((t) => {
      const threatDate = new Date(t.processedAt).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
      })
      const dayObj = last7Days.find((d) => d.date === threatDate)
      if (dayObj) dayObj.count += 1
    })
    return last7Days
  }, [filteredThreats])

  const topRiskyVideos = useMemo(
    () =>
      [...filteredThreats]
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 6),
    [filteredThreats]
  )
  const recentThreats = useMemo(
    () =>
      [...filteredThreats]
        .sort(
          (a, b) =>
            new Date(b.processedAt).getTime() -
            new Date(a.processedAt).getTime()
        )
        .slice(0, 8),
    [filteredThreats]
  )

  // ==================== ИСПРАВЛЕННАЯ ФУНКЦИЯ ====================
  const handleCheckVideo = async () => {
    if (!videoUrl.trim()) return
    setIsChecking(true)
    try {
      // ✅ Добавляем userId в query-параметры
      const userIdParam = user?.user_id ? `&userId=${user.user_id}` : ''
      const response = await fetch(
        `http://localhost:8000/analyze?url=${encodeURIComponent(videoUrl)}${userIdParam}`
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

      // ✅ Исправлено: userId берём из user?.user_id
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
        userId: user?.user_id || null, // <-- ЗДЕСЬ БЫЛО user?.userId
      })
    } catch (error: any) {
      console.error('Ошибка при проверке видео:', error)
      setCheckResultMessage(`❌ Ошибка: ${error.message}`)
    } finally {
      setIsChecking(false)
      setVideoUrl('')
      setTimeout(() => setCheckResultMessage(null), 7000)
    }
  }

  const handleReportSubmit = () => {
    if (!reportedUrl.trim()) return
    setReportSuccess(true)
    setTimeout(() => {
      setShowReportDialog(false)
      setReportSuccess(false)
      setReportedUrl('')
    }, 1500)
  }

  const handleVideoClick = (id: number) => {
    if (user && (user.role === 'USER' || isAdmin)) navigate(`/video/${id}`)
    else setDrawerOpen(true)
  }

  const langs = [
    { v: 'ru', l: 'Русский', flag: '🇷🇺' },
    { v: 'en', l: 'English', flag: '🇬🇧' },
    { v: 'kz', l: 'Қазақша', flag: '🇰🇿' },
  ]

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
          <Button
            variant="outlined"
            onClick={() => setShowReportDialog(true)}
            sx={{
              borderColor: '#ff3366',
              color: '#ff3366',
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              bgcolor: 'rgba(0,0,0,0.5)',
            }}
          >
            Пожаловаться
          </Button>
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
          <Grid container spacing={3} sx={{ mb: 5 }}>
            {[
              {
                icon: <VideoLibraryIcon />,
                label: 'Видео обработано',
                value: allMockThreats.length,
                color: '#33ffcc',
              },
              {
                icon: <WarningIcon />,
                label: 'Угроз выявлено',
                value: allMockThreats.filter((t) => t.riskScore > 0.7).length,
                color: '#ff3366',
              },
              {
                icon: <TrendingUpIcon />,
                label: 'Авторов в топе',
                value: [...new Set(allMockThreats.map((t) => t.author))].length,
                color: '#ffaa44',
              },
              {
                icon: <AnalyticsIcon />,
                label: 'Платформ',
                value: [...new Set(allMockThreats.map((t) => t.platform))]
                  .length,
                color: '#aa66ff',
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
              <InputLabel sx={{ color: '#0ff' }}>Тип угрозы</InputLabel>
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
                label="Тип угрозы"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={RISK_TYPES.find((r) => r.id === value)?.name}
                        size="small"
                        sx={{
                          bgcolor: RISK_TYPES.find((r) => r.id === value)
                            ?.color,
                          color: '#fff',
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {RISK_TYPES.map((rt) => (
                  <MenuItem key={rt.id} value={rt.id}>
                    {rt.icon} {rt.name}
                  </MenuItem>
                ))}
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
            <ReportProblemIcon /> 🚨 ТОП-6 самых опасных видео
          </Typography>
          <Box
            sx={{ display: 'flex', overflowX: 'auto', gap: 3, pb: 3, mb: 5 }}
          >
            {topRiskyVideos.map((video) => (
              <motion.div
                key={video.id}
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{ flex: '0 0 auto', width: 260 }}
              >
                <Card
                  onClick={() => handleVideoClick(video.id)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: 'rgba(20,20,40,0.8)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 4,
                    border: `1px solid ${video.riskTypes[0]?.color || '#ff3366'}`,
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
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <Chip
                      label={`RISK ${Math.round(video.riskScore * 100)}%`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: '#ff3366',
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
                      {video.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#aaa' }}>
                      @{video.author} • {video.platform}
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        display: 'flex',
                        gap: 0.5,
                        flexWrap: 'wrap',
                      }}
                    >
                      {video.riskTypes.map((rt) => (
                        <Chip
                          key={rt.id}
                          label={rt.name}
                          size="small"
                          sx={{
                            bgcolor: rt.color,
                            color: '#fff',
                            fontSize: '0.65rem',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Card>
              </motion.div>
            ))}
          </Box>
          <Typography variant="h5" sx={{ mb: 2, color: '#88f' }}>
            ⏱️ Последние выявленные угрозы
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
                {recentThreats.map((threat, idx) => (
                  <motion.div
                    key={threat.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ListItem
                      button
                      onClick={() => handleVideoClick(threat.id)}
                    >
                      <ListItemAvatar>
                        <Avatar src={threat.thumbnail} variant="rounded" />
                      </ListItemAvatar>
                      <ListItemText
                        primary={threat.title}
                        secondary={`${threat.author} • ${threat.platform} • ${new Date(threat.processedAt).toLocaleString()} • 👁️ ${threat.views.toLocaleString()} • 💬 ${threat.comments}`}
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: '#aaa' }}
                      />
                      <Box
                        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={threat.riskScore * 100}
                          sx={{ width: 80, height: 6, borderRadius: 3 }}
                        />
                        <Chip
                          label={`${Math.round(threat.riskScore * 100)}%`}
                          size="small"
                          sx={{ bgcolor: '#ff3366', color: '#fff' }}
                        />
                      </Box>
                    </ListItem>
                    <Divider variant="inset" sx={{ borderColor: '#333' }} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>
          </Card>
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
                  <Typography variant="h6" sx={{ color: '#0ff', mb: 1 }}>
                    🔍 Как это работает?
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ddd' }}>
                    AI Media Watch анализирует видео в 3 этапа: 1) Извлечение
                    ключевых кадров, аудио и текста (OCR). 2) Детекция
                    визуальных маркеров казино/пирамид (YOLO), транскрибация
                    речи (Whisper), поиск запрещённых фраз (NLP). 3) Вынесение
                    вердикта и объяснение риска.
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
                  <Typography variant="h6" sx={{ color: '#0ff', mb: 1 }}>
                    ⚠️ Почему это важно?
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ddd' }}>
                    Ежедневно тысячи пользователей попадаются на уловки
                    мошенников в соцсетях: фейковые казино, финансовые пирамиды,
                    реферальные схемы. Наш AI помогает выявлять такие угрозы до
                    того, как они нанесут вред.
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
                  <Typography variant="subtitle1" sx={{ color: '#ffaa44' }}>
                    🎰 Нелегальные казино
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
                  <Typography variant="subtitle1" sx={{ color: '#ffaa44' }}>
                    📈 Финансовые пирамиды
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ddd' }}>
                    «Инвестируй 1000, получи 10000» — классическая схема Понци.
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
                  <Typography variant="subtitle1" sx={{ color: '#ffaa44' }}>
                    🔗 Реферальные схемы
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ddd' }}>
                    Заработок только на привлечении новых жертв без реального
                    продукта.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Grid container spacing={3} sx={{ mb: 5 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card
                sx={{
                  bgcolor: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 3,
                  p: 2,
                  border: '1px solid #33ffcc',
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: '#0ff' }}>
                  📈 Динамика угроз (последние 7 дней)
                </Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trendByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#111',
                        borderColor: '#0ff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#ff3366"
                      fill="url(#gradient)"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#ff3366"
                          stopOpacity={0.6}
                        />
                        <stop
                          offset="100%"
                          stopColor="#ff3366"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
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
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: '#ffaa44' }}>
                  🥧 Типы угроз
                </Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={riskTypeStats}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {riskTypeStats.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
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
            <Typography variant="h6" sx={{ color: '#0ff', mb: 2 }}>
              🛡️ Как защитить себя от мошенничества?
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ color: '#ddd' }}>
                  ✅ Не переходите по подозрительным ссылкам
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ color: '#ddd' }}>
                  ✅ Проверяйте отзывы о казино/инвестициях
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ color: '#ddd' }}>
                  ✅ Не доверяйте гарантированному доходу
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" sx={{ color: '#ddd' }}>
                  ✅ Используйте наш AI для проверки видео
                </Typography>
              </Grid>
            </Grid>
            <Button
              variant="text"
              sx={{
                mt: 3,
                color: '#0ff',
                border: '1px solid #0ff',
                borderRadius: 4,
              }}
            >
              📡 Получить API для интеграции
            </Button>
          </Box>
        </Box>
      </Box>
      <Dialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        PaperProps={{
          sx: { bgcolor: '#111', color: '#fff', border: '1px solid #ff3366' },
        }}
      >
        <DialogTitle>Пожаловаться на видео</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ссылка на видео"
            fullWidth
            variant="outlined"
            value={reportedUrl}
            onChange={(e) => setReportedUrl(e.target.value)}
            sx={{ input: { color: '#fff' }, label: { color: '#aaa' } }}
          />
          <Typography variant="caption">
            Мы проверим жалобу и примем меры.
          </Typography>
          {reportSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Спасибо! Жалоба отправлена.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>Отмена</Button>
          <Button
            onClick={handleReportSubmit}
            sx={{ bgcolor: '#ff3366', color: '#fff' }}
          >
            Отправить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CyberMediaWatchPro
