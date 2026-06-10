import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react'
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
  type SelectChangeEvent,
  Grid,
  Card,
  CardContent,
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
  Tooltip,
  Badge,
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
import TimelineIcon from '@mui/icons-material/Timeline'
import WhatshotIcon from '@mui/icons-material/Whatshot'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  Text,
  Float,
  Environment,
  Html,
  Stars,
  Sparkles,
} from '@react-three/drei'
import * as THREE from 'three'
import {
  LineChart,
  Line,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUser } from '../context/user/useUser'
import AppSidebar from '../components/AppSidebar'

// ---------- 3D Floating Icons, Danger/Safety Badges, Logos, and a little video (chaotic motion) ----------
const FloatingIconsAndCode = () => {
  const groupRef = useRef<THREE.Group>(null!)

  // Создаём 60 случайных объектов: иконки, логотипы, видео-превью
  const elements = useMemo(() => {
    const icons = [
      { type: 'danger', symbol: '⚠️', color: '#ff3366', size: 0.6 },
      { type: 'danger', symbol: '🎰', color: '#ff8844', size: 0.7 },
      { type: 'danger', symbol: '📈', color: '#ffaa44', size: 0.6 },
      { type: 'danger', symbol: '💰', color: '#ff6666', size: 0.6 },
      { type: 'danger', symbol: '🔗', color: '#ff9966', size: 0.5 },
      { type: 'danger', symbol: '💀', color: '#ff44aa', size: 0.6 },
      { type: 'safety', symbol: '🛡️', color: '#33ffcc', size: 0.6 },
      { type: 'safety', symbol: '🔒', color: '#33aaff', size: 0.5 },
      { type: 'safety', symbol: '✅', color: '#44ff66', size: 0.5 },
      {
        type: 'logo',
        symbol: '📱',
        color: '#00f2ea',
        size: 0.5,
        label: 'TikTok',
      },
      {
        type: 'logo',
        symbol: '📸',
        color: '#e4405f',
        size: 0.5,
        label: 'Instagram',
      },
      {
        type: 'logo',
        symbol: '▶️',
        color: '#ff0000',
        size: 0.5,
        label: 'YouTube',
      },
    ]

    // Несколько видео-превью (HTML-элементы с картинкой)
    const videoCount = 3
    const result = []

    // Иконки (45 штук)
    for (let i = 0; i < 45; i++) {
      const icon = icons[i % icons.length]
      result.push({
        type: 'icon',
        symbol: icon.symbol,
        color: icon.color,
        size: icon.size,
        position: [
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 10 - 5,
        ],
        speed: 0.2 + Math.random() * 0.6,
        rotSpeed: 0.2 + Math.random() * 0.5,
      })
    }

    // Видео-превью (3 штуки, с реальными картинками)
    for (let i = 0; i < videoCount; i++) {
      result.push({
        type: 'video',
        thumbnail: `https://picsum.photos/id/${200 + i}/100/80`,
        color: '#ff3366',
        size: 1.0,
        position: [
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 8 - 4,
        ],
        speed: 0.3 + Math.random() * 0.5,
        rotSpeed: 0.1 + Math.random() * 0.3,
      })
    }

    return result
  }, [])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Общее вращение группы
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.03
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.1

      // Анимируем каждый элемент отдельно (хаотичное движение)
      groupRef.current.children.forEach((child, idx) => {
        const element = elements[idx]
        if (element && child.userData) {
          const t = clock.getElapsedTime() * element.speed
          // Случайное смещение по окружности
          child.position.x = element.position[0] + Math.sin(t) * 1.2
          child.position.y = element.position[1] + Math.cos(t * 0.7) * 1.0
          child.position.z = element.position[2] + Math.sin(t * 0.5) * 1.5
          child.rotation.y += 0.01
          child.rotation.x = Math.sin(t) * 0.5
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {elements.map((el, idx) => {
        if (el.type === 'icon') {
          return (
            <Float
              key={idx}
              speed={1}
              rotationIntensity={0.2}
              floatIntensity={0.5}
            >
              <mesh
                position={el.position as [number, number, number]}
                userData={{ speed: el.speed }}
              >
                <planeGeometry args={[el.size, el.size]} />
                <meshStandardMaterial
                  color={el.color}
                  emissive={el.color}
                  emissiveIntensity={0.3}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.9}
                />
                <Html
                  distanceFactor={12}
                  position={[0, 0, 0.05]}
                  transform
                  center
                >
                  <div
                    style={{
                      fontSize: `${el.size * 40}px`,
                      textAlign: 'center',
                      filter: `drop-shadow(0 0 5px ${el.color})`,
                    }}
                  >
                    {el.symbol}
                  </div>
                </Html>
              </mesh>
            </Float>
          )
        } else if (el.type === 'video') {
          return (
            <Float
              key={idx}
              speed={0.8}
              rotationIntensity={0.3}
              floatIntensity={0.6}
            >
              <mesh
                position={el.position as [number, number, number]}
                userData={{ speed: el.speed }}
              >
                <planeGeometry args={[1.2, 0.9]} />
                <meshStandardMaterial
                  color={el.color}
                  emissive={el.color}
                  emissiveIntensity={0.2}
                  side={THREE.DoubleSide}
                />
                <Html distanceFactor={10} position={[0, 0, 0.05]} transform>
                  <div
                    style={{
                      width: 120,
                      height: 90,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: `1px solid ${el.color}`,
                      background: '#000',
                    }}
                  >
                    <img
                      src={el.thumbnail}
                      alt="threat video"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                </Html>
              </mesh>
            </Float>
          )
        }
        return null
      })}
    </group>
  )
}

// Космический фон с тусклым кодом
const CodeSpaceBackground = () => {
  const codeLines = useMemo(() => {
    const snippets = [
      'const threat = detect();',
      'if (risk > 0.8) alert();',
      'function scanVideo() {}',
      'import { analyze } from "ai";',
      'const patterns = /casino|pyramid/i;',
      'fetch("/api/check")',
      'model.predict(video)',
      'for (let i=0; i< threats; i++)',
      'return riskScore;',
      'console.log("threat detected");',
      'const config = { model: "yolo" };',
      'await transcribe(audio);',
      'TensorFlow.js',
      'ONNX Runtime',
      'CatBoost',
    ]
    const lines = []
    for (let i = 0; i < 80; i++) {
      lines.push({
        text:
          snippets[i % snippets.length] +
          ' ' +
          Math.random().toString(36).substring(2, 5),
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 12,
        z: (Math.random() - 0.5) * 15 - 10,
        opacity: 0.08 + Math.random() * 0.1,
      })
    }
    return lines
  }, [])

  return (
    <group>
      {codeLines.map((line, idx) => (
        <Text
          key={idx}
          position={[line.x, line.y, line.z]}
          fontSize={0.25}
          color="#88aaff"
          opacity={line.opacity}
          transparent
          depthTest={false}
        >
          {line.text}
        </Text>
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
      <Canvas camera={{ position: [0, 2, 14], fov: 55 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.6} />
        <pointLight position={[-5, -5, 5]} color="#ff3366" intensity={0.3} />

        {/* Тусклый код на заднем плане */}
        <CodeSpaceBackground />

        {/* Хаотично движущиеся иконки и видео */}
        <FloatingIconsAndCode />

        <Stars
          radius={150}
          depth={60}
          count={2500}
          factor={5}
          saturation={0}
          fade
          speed={0.4}
        />
        <Environment preset="night" />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          target={[0, 0, 0]}
        />
      </Canvas>
    </Box>
  )
}

// ---------- Вспомогательные компоненты ----------
const CountUp = ({
  value,
  duration = 1.5,
}: {
  value: number
  duration?: number
}) => {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) return
    const increment = end / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [value, duration])
  return <span>{count.toLocaleString()}</span>
}

// Типы угроз с цветами
const RISK_TYPES = [
  {
    id: 'casino',
    name: 'Нелегальное казино',
    color: '#ff3366',
    icon: '🎰',
    description: 'Продвижение онлайн-казино без лицензии',
  },
  {
    id: 'pyramid',
    name: 'Финансовая пирамида',
    color: '#ffaa44',
    icon: '📈',
    description: 'Схема Понци, обещание сверхдоходов',
  },
  {
    id: 'gambling',
    name: 'Азарт без лицензии',
    color: '#ff8844',
    icon: '🃏',
    description: 'Лотереи, покер, ставки',
  },
  {
    id: 'guaranteed',
    name: 'Гарантированный доход',
    color: '#ff6666',
    icon: '💰',
    description: 'Ложные обещания пассивного дохода',
  },
  {
    id: 'referral',
    name: 'Реферальная схема',
    color: '#ff9966',
    icon: '🔗',
    description: 'Многоуровневый маркетинг без продукта',
  },
  {
    id: 'crypto_scam',
    name: 'Крипто-мошенничество',
    color: '#ff44aa',
    icon: '₿',
    description: 'Фейковые ICO, скам-токены',
  },
]

// Генерация моковых данных
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

// ---------- Главный компонент ----------
const CyberMediaWatchPro = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week')
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string[]>([])
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportedUrl, setReportedUrl] = useState('')
  const [reportSuccess, setReportSuccess] = useState(false)

  const isAdmin = user?.role === 'ADMIN'
  const { t, i18n } = useTranslation()

  // Фильтрация
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

  const topAuthors = useMemo(() => {
    const authorMap = new Map<string, { count: number; avgRisk: number }>()
    filteredThreats.forEach((t) => {
      const existing = authorMap.get(t.author)
      if (existing) {
        existing.count += 1
        existing.avgRisk = (existing.avgRisk + t.riskScore) / 2
      } else authorMap.set(t.author, { count: 1, avgRisk: t.riskScore })
    })
    return Array.from(authorMap.entries())
      .map(([author, data]) => ({ author, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filteredThreats])

  const topRiskyVideos = useMemo(
    () =>
      [...filteredThreats]
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 6),
    [filteredThreats]
  )

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

  const warningMessage = useMemo(() => {
    const top = topRiskyVideos[0]
    if (!top) return 'Нет активных угроз'
    if (top.riskScore > 0.9)
      return `⚠️ КРИТИЧЕСКАЯ УГРОЗА: ${top.title} от @${top.author} с риском ${Math.round(top.riskScore * 100)}%! Срочно проверьте.`
    if (top.riskScore > 0.7)
      return `🔔 Высокий риск: ${top.title} (${Math.round(top.riskScore * 100)}%) – рекомендуется блокировка.`
    return `📊 За период выявлено ${filteredThreats.length} подозрительных видео.`
  }, [topRiskyVideos, filteredThreats.length])

  const handleCheckVideo = async () => {
    if (!videoUrl.trim()) return
    setIsChecking(true)
    setTimeout(() => {
      setIsChecking(false)
      setVideoUrl('')
    }, 2000)
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

      {/* Neon Grid Overlay (едва заметная) */}
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
        {/* Header */}
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

        <AppSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', px: 3, py: 6 }}>
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
            {warningMessage && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <Alert
                  severity="warning"
                  sx={{
                    mb: 3,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,51,102,0.2)',
                    border: '1px solid #ff3366',
                    color: '#ffcc88',
                  }}
                >
                  {warningMessage}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Проверка видео */}
          <Card
            sx={{
              mb: 5,
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

          {/* Фильтры */}
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

          {/* Статистика */}
          <Grid container spacing={3} sx={{ mb: 5 }}>
            {[
              {
                icon: <VideoLibraryIcon />,
                label: 'Видео обработано',
                value: 18740,
                color: '#33ffcc',
              },
              {
                icon: <WarningIcon />,
                label: 'Угроз выявлено',
                value: filteredThreats.length,
                color: '#ff3366',
              },
              {
                icon: <TrendingUpIcon />,
                label: 'Авторов в топе',
                value: topAuthors.length,
                color: '#ffaa44',
              },
              {
                icon: <AnalyticsIcon />,
                label: 'Платформ',
                value: 3,
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
                        <CountUp value={item.value} />
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

          {/* Графики */}
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

          {/* Топ авторов */}
          <Card
            sx={{
              mb: 5,
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              borderRadius: 3,
              p: 2,
              border: '1px solid #ff9966',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                color: '#ff9966',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <WhatshotIcon /> Топ-5 авторов по количеству угроз
            </Typography>
            <Grid container spacing={2}>
              {topAuthors.map((author, idx) => (
                <Grid size={{ xs: 12, sm: 4 }} key={author.author}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      bgcolor: 'rgba(0,0,0,0.4)',
                      p: 1,
                      borderRadius: 2,
                    }}
                  >
                    <Avatar sx={{ bgcolor: '#ff3366' }}>{idx + 1}</Avatar>
                    <Box>
                      <Typography fontWeight="bold" sx={{ color: '#fff' }}>
                        @{author.author}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ccc' }}>
                        Угроз: {author.count} • Ср. риск:{' '}
                        {Math.round(author.avgRisk * 100)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>

          {/* Топ угроз */}
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
                whileHover={{ scale: 1.05, rotate: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{ flex: '0 0 auto', width: 280 }}
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
                      height: 150,
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

          {/* Последние угрозы */}
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
                {filteredThreats.slice(0, 8).map((threat, idx) => (
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

          {/* Информационный блок */}
          <Box
            sx={{
              textAlign: 'center',
              mt: 4,
              p: 3,
              borderRadius: 3,
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Typography variant="h6" sx={{ color: '#0ff' }}>
              🛡️ Как мы предостерегаем?
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ color: '#ddd' }}>
                  ✅ Автоматическое распознавание визуальных маркеров
                  казино/пирамид
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ color: '#ddd' }}>
                  ✅ Транскрибация аудио и NLP-анализ текста на запрещённые
                  фразы
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ color: '#ddd' }}>
                  ✅ Построение графа реферальных связей и выявление
                  организованных групп
                </Typography>
              </Grid>
            </Grid>
            <Button
              variant="text"
              sx={{
                mt: 2,
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

      {/* Диалог жалобы */}
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
