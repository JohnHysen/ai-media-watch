import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link,
  Divider,
  LinearProgress,
  Avatar,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WarningIcon from '@mui/icons-material/Warning'
import SecurityIcon from '@mui/icons-material/Security'
import PaymentsIcon from '@mui/icons-material/Payments'
import CasinoIcon from '@mui/icons-material/Casino'
import AnnouncementIcon from '@mui/icons-material/Announcement'
import BlockIcon from '@mui/icons-material/Block'
import VerifiedIcon from '@mui/icons-material/Verified'
import ChatIcon from '@mui/icons-material/Chat'
import LinkIcon from '@mui/icons-material/Link'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import TelegramIcon from '@mui/icons-material/Telegram'
import InstagramIcon from '@mui/icons-material/Instagram'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import RefreshIcon from '@mui/icons-material/Refresh'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'
import CyberSidebar from '../components/CyberSidebar'
import { $host, getVideoAnalyses, VideoAnalysis } from '../http/API'

const FloatingCube = ({ position, color, size, speed }: any) => {
  const meshRef = React.useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * speed
      meshRef.current.rotation.y = clock.getElapsedTime() * speed * 0.8
      meshRef.current.rotation.z = clock.getElapsedTime() * speed * 0.6
    }
  })
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2}
        metalness={0.6}
        roughness={0.2}
      />
    </mesh>
  )
}

const CubeSpaceBackground = () => {
  const cubes = [
    { color: '#ff3366', size: 0.8, position: [-4, 1, -6], speed: 0.3 },
    { color: '#33ffcc', size: 1.0, position: [5, -2, -8], speed: 0.2 },
    { color: '#ffaa44', size: 0.7, position: [2, 3, -12], speed: 0.4 },
    { color: '#aa66ff', size: 1.2, position: [-3, -1, -15], speed: 0.15 },
    { color: '#44ff66', size: 0.9, position: [0, 4, -10], speed: 0.25 },
    { color: '#ff6699', size: 0.6, position: [6, 2, -18], speed: 0.35 },
    { color: '#0ff', size: 0.8, position: [-5, -3, -14], speed: 0.28 },
    { color: '#ff8844', size: 1.1, position: [4, 1, -20], speed: 0.18 },
  ]
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        backgroundColor: '#030318',
      }}
    >
      <Canvas camera={{ position: [0, 2, 12], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-5, -5, 5]} color="#ff3366" intensity={0.3} />
        {cubes.map((cube, idx) => (
          <FloatingCube key={idx} {...cube} />
        ))}
        <Stars
          radius={100}
          depth={60}
          count={2000}
          factor={5}
          saturation={0}
          fade
          speed={0.2}
        />
        <Environment preset="night" />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.08}
          target={[0, 0, 0]}
        />
      </Canvas>
    </Box>
  )
}

const THREAT_DEFINITIONS = [
  {
    id: 'казино',
    title: 'Нелегальные онлайн-казино',
    icon: <CasinoIcon sx={{ fontSize: 40 }} />,
    color: '#ff3366',
    description:
      'Реклама и призывы к регистрации в онлайн-казино через видео в TikTok, Instagram, YouTube.',
    detection:
      'Видео с «успешными игроками», демонстрацией выигрышей, ссылками в описании. AI распознаёт визуальные маркеры (рулетка, карты, фишки), а также ключевые фразы в аудиодорожке.',
    advice:
      'Не переходите по ссылкам в описании. Наш AI Media Watch автоматически помечает такие видео и отправляет в приоритетный список для модерации.',
  },
  {
    id: 'пирамида',
    title: 'Финансовые пирамиды и хайпы',
    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
    color: '#ff8844',
    description:
      'Видео, обещающие «гарантированный доход», «пассивный заработок», «инвестиции под 50% в месяц».',
    detection:
      'Короткие ролики с агрессивными инвест-призывами, скриншотами «заработка», приглашениями в Telegram-каналы. AI анализирует текст, субтитры и аудио на наличие фраз-маркеров пирамид.',
    advice:
      'Помните: высокий доход без риска невозможен. Наш AI вычисляет такие видео по паттернам речи и визуальной стилистике. Сообщайте о подозрительных роликах.',
  },
  {
    id: 'инвестиции',
    title: 'Мошеннические инвестиции',
    icon: <PaymentsIcon sx={{ fontSize: 40 }} />,
    color: '#ff9966',
    description:
      'Видео, обещающие быстрый заработок на инвестициях, криптовалюте, форексе, «секретных схемах».',
    detection:
      'Ролики с нарезкой «богатой жизни», психологические триггеры («успешный успех»), призывы вступить в закрытый клуб. AI анализирует аудио на агрессивные интонации и запрещённые фразы.',
    advice:
      'Не верьте обещаниям лёгких денег. Наш AI распознаёт эти паттерны и блокирует видео ещё до того, как оно наберёт популярность.',
  },
  {
    id: 'крипто',
    title: 'Крипто-мошенничество',
    icon: <PaymentsIcon sx={{ fontSize: 40 }} />,
    color: '#ffaa44',
    description:
      'Видео, рекламирующие скам-токены, ICO, «быстрые заработки» на криптовалютах. Используют технический жаргон для создания иллюзии профессионализма.',
    detection:
      'AI анализирует упоминания криптовалют, токенов, а также проверяет ссылки на сомнительные обменники и кошельки.',
    advice:
      'Не доверяйте проектам, обещающим гарантированную доходность. Изучайте whitepaper и репутацию команды.',
  },
  {
    id: 'рефералы',
    title: 'Реферальные схемы',
    icon: <LinkIcon sx={{ fontSize: 40 }} />,
    color: '#ffaa44',
    description:
      'Видео с призывами регистрироваться по реферальным ссылкам в казино, бинарных опционах, криптопроектах.',
    detection:
      'Блогеры скрыто рекламируют реферальные программы, маскируя их под «личный опыт». AI анализирует ссылки в описании, комментариях, а также распознаёт упоминания «партнёрской программы».',
    advice:
      'Не переходите по подозрительным реферальным ссылкам. Наша система автоматически проверяет все ссылки из видео и помечает мошеннические.',
  },
  {
    id: 'понци',
    title: 'Схема Понци',
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    color: '#ff6666',
    description:
      'Классическая схема Понци – выплаты старым инвесторам за счёт новых. Видео маскируются под «успешный инвестиционный фонд» с обещанием высоких процентов.',
    detection:
      'AI выявляет паттерны: обещание стабильного высокого дохода, акцент на срочность вступления, агрессивная реклама в соцсетях.',
    advice:
      'Если доход слишком высок и не зависит от рынка – это мошенничество. Проверяйте отзывы и репутацию.',
  },
]

const truncateToSentences = (text: string, maxSentences = 5): string => {
  if (!text) return ''
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const truncated = sentences.slice(0, maxSentences).join(' ')
  if (sentences.length > maxSentences) {
    return truncated.trim() + '…'
  }
  return truncated.trim()
}

const Analytics = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [news, setNews] = useState<any[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [newsError, setNewsError] = useState('')
  const [newsFilter, setNewsFilter] = useState<'all' | 'telegram' | 'media'>(
    'all'
  )
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [updating, setUpdating] = useState(false)

  const [videoAnalyses, setVideoAnalyses] = useState<VideoAnalysis[]>([])
  const [loadingAnalyses, setLoadingAnalyses] = useState(true)
  const [analysesError, setAnalysesError] = useState<string | null>(null)

  const fetchAnalyses = async () => {
    setLoadingAnalyses(true)
    setAnalysesError(null)
    try {
      const response = await getVideoAnalyses({ limit: 1000, offset: 0 })
      setVideoAnalyses(response.data)
    } catch (err) {
      console.error('Ошибка загрузки видеоанализов:', err)
      setAnalysesError('Ошибка')
    } finally {
      setLoadingAnalyses(false)
    }
  }

  const fetchNews = async (showLoading = true) => {
    if (showLoading) setLoadingNews(true)
    setUpdating(true)
    try {
      const res = await $host.get('/news', { params: { limit: 50 } })
      setNews(res.data.articles || [])
      setLastUpdated(new Date())
      setNewsError('')
    } catch (err) {
      console.error('Ошибка загрузки новостей:', err)
      setNewsError('Не удалось загрузить новости')
    } finally {
      setLoadingNews(false)
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchAnalyses()
    fetchNews(true)
    const interval = setInterval(() => {
      fetchNews(false)
    }, 3600000)
    return () => clearInterval(interval)
  }, [])

  const filteredNews = news.filter((item) => {
    const source = item.source?.toLowerCase() || ''
    if (source.includes('instagram')) return false
    if (newsFilter === 'all') return true
    if (newsFilter === 'telegram') return source.includes('telegram')
    if (newsFilter === 'media') return !source.includes('telegram')
    return true
  })

  const getSourceIcon = (source: string) => {
    const s = source?.toLowerCase() || ''
    if (s.includes('telegram'))
      return <TelegramIcon sx={{ color: '#0ff', fontSize: 18 }} />
    return <AnnouncementIcon sx={{ color: '#ffaa44', fontSize: 18 }} />
  }

  const threatStats = useMemo(() => {
    const map: Record<string, number> = {}
    videoAnalyses.forEach((v) => {
      if (v.primary_risk) {
        const key = v.primary_risk
        map[key] = (map[key] || 0) + 1
      }
    })
    return map
  }, [videoAnalyses])

  const threatData = useMemo(() => {
    const data = THREAT_DEFINITIONS.map((def) => ({
      ...def,
      count: threatStats[def.id] || 0,
    }))
    const maxCount = Math.max(...data.map((d) => d.count), 1)
    const sortedCounts = data.map((d) => d.count).sort((a, b) => a - b)
    const median = sortedCounts[Math.floor(sortedCounts.length / 2)] || 0
    const q3 = sortedCounts[Math.floor(sortedCounts.length * 0.75)] || 0

    return data.map((item) => {
      let riskLevel = 'Низкий'
      let riskColor = '#33ffcc'
      if (maxCount === 0) {
        riskLevel = 'Низкий'
        riskColor = '#33ffcc'
      } else if (item.count > q3) {
        riskLevel = 'Высокий'
        riskColor = '#ff3366'
      } else if (item.count > median) {
        riskLevel = 'Средний'
        riskColor = '#ffaa44'
      } else {
        riskLevel = 'Низкий'
        riskColor = '#33ffcc'
      }
      const percent = (item.count / maxCount) * 100
      return {
        ...item,
        riskLevel,
        riskColor,
        percent,
      }
    })
  }, [threatStats])

  return (
    <>
      <CubeSpaceBackground />
      <Box sx={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 1300,
            color: '#0ff',
            bgcolor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            '&:hover': { bgcolor: '#0ff', color: '#000' },
          }}
        >
          <MenuIcon />
        </IconButton>

        <CyberSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <Box sx={{ px: '10%', py: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #ff3366, #33ffcc)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Аналитика угроз в видео
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ color: '#aaa', mb: 4, textAlign: 'center' }}
            >
              Как AI Media Watch выявляет мошенничество, казино и пирамиды в
              TikTok, Instagram и YouTube
            </Typography>
          </motion.div>

          <Typography
            variant="h5"
            sx={{
              color: '#0ff',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <AnalyticsIcon /> Рейтинг угроз по количеству выявленных случаев
          </Typography>

          {loadingAnalyses ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress sx={{ color: '#0ff' }} />
            </Box>
          ) : analysesError ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {analysesError}
            </Alert>
          ) : (
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {threatData.map((threat, idx) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={threat.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      sx={{
                        bgcolor: 'rgba(10,10,30,0.7)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: 4,
                        border: `1px solid ${threat.color}`,
                        height: '100%',
                        transition: '0.2s',
                        '&:hover': {
                          transform: 'translateY(-6px)',
                          boxShadow: `0 0 20px ${threat.color}`,
                        },
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: threat.color,
                              width: 56,
                              height: 56,
                            }}
                          >
                            {threat.icon}
                          </Avatar>
                          <Chip
                            label={threat.riskLevel}
                            sx={{
                              bgcolor: threat.riskColor,
                              color: '#fff',
                              fontWeight: 'bold',
                            }}
                          />
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 'bold', color: '#fff', mb: 1 }}
                        >
                          {threat.title}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ color: '#aaa' }}>
                            Количество угроз:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: '#fff', fontWeight: 'bold' }}
                          >
                            {threat.count}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={threat.percent}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#333',
                            mb: 1,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: threat.riskColor,
                            },
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: '#ddd', mb: 1 }}
                        >
                          <strong>Описание:</strong> {threat.description}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: '#ddd', mb: 1 }}
                        >
                          <strong>Как AI распознаёт:</strong> {threat.detection}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: '#ffaa66', mb: 1 }}
                        >
                          <strong>Что делать:</strong> {threat.advice}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}

          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  bgcolor: 'rgba(10,10,30,0.7)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 4,
                  border: '1px solid rgba(0,255,255,0.3)',
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#33ffcc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <AnnouncementIcon /> Актуальные новости
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {lastUpdated && (
                      <Typography variant="caption" sx={{ color: '#aaa' }}>
                        Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
                      </Typography>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => fetchNews(true)}
                      disabled={updating}
                      sx={{ color: '#0ff' }}
                    >
                      <RefreshIcon
                        sx={{
                          animation: updating
                            ? 'spin 1s linear infinite'
                            : 'none',
                        }}
                      />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label="Все"
                    onClick={() => setNewsFilter('all')}
                    color={newsFilter === 'all' ? 'primary' : 'default'}
                    sx={{ color: newsFilter === 'all' ? '#000' : '#fff' }}
                  />
                  <Chip
                    label="Telegram"
                    icon={<TelegramIcon />}
                    onClick={() => setNewsFilter('telegram')}
                    color={newsFilter === 'telegram' ? 'primary' : 'default'}
                    sx={{ color: newsFilter === 'telegram' ? '#000' : '#fff' }}
                  />
                  <Chip
                    label="СМИ"
                    icon={<AnnouncementIcon />}
                    onClick={() => setNewsFilter('media')}
                    color={newsFilter === 'media' ? 'primary' : 'default'}
                    sx={{ color: newsFilter === 'media' ? '#000' : '#fff' }}
                  />
                </Box>

                {loadingNews ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      py: 4,
                      flex: 1,
                    }}
                  >
                    <CircularProgress sx={{ color: '#0ff' }} />
                  </Box>
                ) : newsError ? (
                  <Alert
                    severity="warning"
                    sx={{ bgcolor: 'rgba(255,51,102,0.2)', color: '#ff8888' }}
                  >
                    {newsError}
                  </Alert>
                ) : filteredNews.length === 0 ? (
                  <Typography
                    sx={{
                      color: '#aaa',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Нет новостей по выбранному фильтру
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      height: 520,
                      overflowY: 'auto',
                      pr: 1,
                      '&::-webkit-scrollbar': { width: '4px' },
                      '&::-webkit-scrollbar-track': {
                        background: 'rgba(0,255,255,0.1)',
                        borderRadius: '10px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#0ff',
                        borderRadius: '10px',
                      },
                    }}
                  >
                    {filteredNews.map((item, idx) => {
                      const shortDescription = truncateToSentences(
                        item.description,
                        5
                      )
                      return (
                        <Box
                          key={idx}
                          sx={{
                            mb: 2,
                            pb: 2,
                            borderBottom:
                              idx !== filteredNews.length - 1
                                ? '1px solid rgba(0,255,255,0.2)'
                                : 'none',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            {getSourceIcon(item.source)}
                            <Typography
                              variant="caption"
                              sx={{ color: '#ffaa66' }}
                            >
                              {item.source || 'Неизвестный источник'}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: '#aaa', ml: 'auto' }}
                            >
                              {new Date(item.publishedAt).toLocaleDateString(
                                'ru-RU',
                                {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </Typography>
                          </Box>

                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <Link
                              href={item.url}
                              target="_blank"
                              sx={{ color: '#0ff', fontWeight: 500 }}
                              underline="hover"
                            >
                              {item.title}
                            </Link>
                          </Typography>

                          {shortDescription && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#aaa',
                                display: '-webkit-box',
                                WebkitLineClamp: 5,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                mb: 0.5,
                              }}
                            >
                              {shortDescription}
                            </Typography>
                          )}

                          <Button
                            size="small"
                            href={item.url}
                            target="_blank"
                            sx={{
                              color: '#0ff',
                              textTransform: 'none',
                              p: 0,
                              minWidth: 'auto',
                              '&:hover': {
                                bgcolor: 'transparent',
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            Читать дальше →
                          </Button>
                        </Box>
                      )
                    })}
                  </Box>
                )}
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  bgcolor: 'rgba(10,10,30,0.7)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 4,
                  border: '1px solid rgba(0,255,255,0.3)',
                  p: 3,
                  height: '100%',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#33ffcc',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <VerifiedIcon /> Официальные источники
                </Typography>
                <TableContainer
                  component={Paper}
                  sx={{ bgcolor: 'transparent', boxShadow: 'none' }}
                >
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ color: '#fff' }}>
                          Агентство по финансовому мониторингу (АФМ)
                        </TableCell>
                        <TableCell>
                          <Link
                            href="https://t.me/afm_rk"
                            target="_blank"
                            sx={{ color: '#0ff' }}
                          >
                            Telegram-канал
                          </Link>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#fff' }}>
                          FinGramota.kz
                        </TableCell>
                        <TableCell>
                          <Link
                            href="https://fingramota.kz"
                            target="_blank"
                            sx={{ color: '#0ff' }}
                          >
                            fingramota.kz
                          </Link>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#fff' }}>
                          Министерство цифрового развития РК
                        </TableCell>
                        <TableCell>
                          <Link
                            href="https://www.gov.kz/memleket/entities/mdai"
                            target="_blank"
                            sx={{ color: '#0ff' }}
                          >
                            Официальный сайт
                          </Link>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#fff' }}>
                          АРРФР (финрынок)
                        </TableCell>
                        <TableCell>
                          <Link
                            href="https://www.gov.kz/memleket/entities/arrfr"
                            target="_blank"
                            sx={{ color: '#0ff' }}
                          >
                            Официальный сайт
                          </Link>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2, borderColor: 'rgba(0,255,255,0.2)' }} />
                <Typography
                  variant="subtitle2"
                  sx={{ color: '#33ffcc', mb: 1 }}
                >
                  Социальные сети АФМ
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Link
                    href="https://t.me/afm_rk"
                    target="_blank"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: '#0ff',
                      textDecoration: 'none',
                    }}
                  >
                    <TelegramIcon /> Telegram
                  </Link>
                  <Link
                    href="https://www.instagram.com/afm_rk/"
                    target="_blank"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: '#e4405f',
                      textDecoration: 'none',
                    }}
                  >
                    <InstagramIcon /> Instagram
                  </Link>
                  <Link
                    href="https://www.tiktok.com/@afm_rk"
                    target="_blank"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: '#00f2ea',
                      textDecoration: 'none',
                    }}
                  >
                    <MusicNoteIcon /> TikTok
                  </Link>
                </Box>
              </Card>
            </Grid>
          </Grid>

          <Card
            sx={{
              bgcolor: 'rgba(10,10,30,0.6)',
              backdropFilter: 'blur(8px)',
              borderRadius: 4,
              border: '1px solid #0ff',
              p: 3,
              textAlign: 'center',
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
              <SecurityIcon /> Как AI Media Watch защищает вас?
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <BlockIcon sx={{ color: '#ff3366', fontSize: 30 }} />
                  <Typography variant="body2" sx={{ color: '#ddd' }}>
                    Автоматический анализ видео
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <ChatIcon sx={{ color: '#33ffcc', fontSize: 30 }} />
                  <Typography variant="body2" sx={{ color: '#ddd' }}>
                    Распознавание аудио и субтитров
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <SecurityIcon sx={{ color: '#ffaa44', fontSize: 30 }} />
                  <Typography variant="body2" sx={{ color: '#ddd' }}>
                    Обнаружение визуальных маркеров
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <LinkIcon sx={{ color: '#ff6666', fontSize: 30 }} />
                  <Typography variant="body2" sx={{ color: '#ddd' }}>
                    Проверка ссылок на мошенничество
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Box>
      </Box>
    </>
  )
}

export default Analytics
