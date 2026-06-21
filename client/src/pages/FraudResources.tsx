import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import MenuIcon from '@mui/icons-material/Menu'
import YouTubeIcon from '@mui/icons-material/YouTube'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import InstagramIcon from '@mui/icons-material/Instagram'
import { motion } from 'framer-motion'
import { $host, getVideoAnalyses, VideoAnalysis } from '../http/API'
import { useUser } from '../context/user/useUser'
import { toast } from 'react-toastify'
import CyberSidebar from '../components/CyberSidebar'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'

// ---------- 3D фон с парящими фигурами ----------
const FloatingShapes = () => {
  const groupRef = React.useRef<THREE.Group>(null!)

  const shapes = React.useMemo(() => {
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
    return geometries.map((geo, idx) => ({
      geometry: geo,
      color: colors[idx % colors.length],
      startX: positions[idx][0],
      startY: positions[idx][1],
      startZ: positions[idx][2],
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

const SpaceBackground = () => {
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

// ---------- Интерфейс для отображения ----------
interface Author {
  id: string
  platform: 'youtube' | 'tiktok' | 'instagram' | 'unknown'
  username: string
  channel_url: string | null
  dangerous_videos_count: number
  total_videos_count: number
}

// ---------- Главный компонент ----------
const FraudResources = () => {
  const { user } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [showOnlyDangerous, setShowOnlyDangerous] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const isAdmin = user?.role === 'ADMIN'
  const isInspector = user?.role === 'INSPECTOR'
  const canManage = isAdmin || isInspector

  // ---------- Загрузка данных из VideoAnalysis ----------
  const fetchAuthors = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getVideoAnalyses({ limit: 1000, offset: 0 })
      const allAnalyses = response.data

      const map = new Map<
        string,
        {
          dangerous: number
          total: number
          platform: string
          channel_url: string | null
        }
      >()
      allAnalyses.forEach((v) => {
        const uploader = v.uploader || 'Аноним'
        if (!map.has(uploader)) {
          map.set(uploader, {
            dangerous: 0,
            total: 0,
            platform: 'unknown',
            channel_url: null,
          })
        }
        const entry = map.get(uploader)!
        entry.total += 1
        if (v.is_dangerous) entry.dangerous += 1
        // Определяем платформу по URL
        if (v.video_url) {
          try {
            const url = new URL(v.video_url)
            const host = url.hostname
            if (host.includes('youtube') || host.includes('youtu.be'))
              entry.platform = 'youtube'
            else if (host.includes('tiktok')) entry.platform = 'tiktok'
            else if (host.includes('instagram')) entry.platform = 'instagram'
            else entry.platform = 'unknown'
            if (!entry.channel_url) entry.channel_url = v.video_url
          } catch {}
        }
      })

      const authorsList = Array.from(map.entries()).map(([username, data]) => ({
        id: username,
        username,
        platform: data.platform as any,
        channel_url: data.channel_url,
        dangerous_videos_count: data.dangerous,
        total_videos_count: data.total,
      }))

      setAuthors(authorsList)
    } catch (err: any) {
      console.error('Ошибка загрузки авторов:', err)
      setError('Не удалось загрузить авторов')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManage) fetchAuthors()
  }, [canManage])

  // ---------- Фильтрация ----------
  const filteredAuthors = useMemo(() => {
    let result = authors
    if (showOnlyDangerous) {
      result = result.filter((a) => a.dangerous_videos_count > 0)
    }
    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.username.toLowerCase().includes(term) ||
          (a.channel_url && a.channel_url.toLowerCase().includes(term))
      )
    }
    if (platformFilter) {
      result = result.filter((a) => a.platform === platformFilter)
    }
    // Сортируем по количеству опасных видео
    result.sort((a, b) => b.dangerous_videos_count - a.dangerous_videos_count)
    return result
  }, [authors, showOnlyDangerous, search, platformFilter])

  // ---------- Авто-обновление каждые 30 секунд ----------
  useEffect(() => {
    if (!canManage) return
    intervalRef.current = setInterval(fetchAuthors, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [canManage])

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <YouTubeIcon sx={{ fontSize: 20, color: '#ff0000' }} />
      case 'tiktok':
        return <MusicNoteIcon sx={{ fontSize: 20, color: '#00f2ea' }} />
      case 'instagram':
        return <InstagramIcon sx={{ fontSize: 20, color: '#e4405f' }} />
      default:
        return null
    }
  }

  if (!canManage) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          position: 'relative',
        }}
      >
        <SpaceBackground />
        <Typography variant="h5" sx={{ position: 'relative', zIndex: 2 }}>
          Доступ запрещён
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', color: '#fff' }}>
      <SpaceBackground />

      {!drawerOpen && (
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
      )}

      <CyberSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1400,
          mx: 'auto',
          px: 3,
          py: 8,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              mb: 4,
              background: 'linear-gradient(135deg, #ff3366, #33ffcc)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Авторы опасных видео
          </Typography>
        </motion.div>

        <Card
          sx={{
            bgcolor: 'rgba(10,10,30,0.7)',
            backdropFilter: 'blur(8px)',
            borderRadius: 4,
            border: '1px solid rgba(0,255,255,0.3)',
            p: 3,
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchAuthors}
                variant="outlined"
                disabled={loading}
                sx={{ borderColor: '#0ff', color: '#0ff' }}
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: '#0ff' }} />
                ) : (
                  'Обновить'
                )}
              </Button>
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyDangerous}
                    onChange={(e) => setShowOnlyDangerous(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#ff3366',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                        {
                          backgroundColor: '#ff3366',
                        },
                    }}
                  />
                }
                label="Только опасные"
                sx={{ color: '#aaa', ml: 1 }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Поиск по имени или URL"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                flex: 1,
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(0,0,0,0.4)',
                  '& fieldset': { borderColor: '#0ff' },
                },
                input: { color: '#fff' },
              }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: '#aaa' }}>Платформа</InputLabel>
              <Select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                label="Платформа"
                sx={{
                  color: '#fff',
                  bgcolor: 'rgba(0,0,0,0.4)',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#0ff' },
                }}
              >
                <MenuItem value="">Все</MenuItem>
                <MenuItem value="youtube">YouTube</MenuItem>
                <MenuItem value="tiktok">TikTok</MenuItem>
                <MenuItem value="instagram">Instagram</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#0ff' }} />
            </Box>
          ) : error ? (
            <Alert
              severity="error"
              sx={{ bgcolor: 'rgba(255,51,102,0.2)', color: '#ff8888' }}
            >
              {error}
            </Alert>
          ) : filteredAuthors.length === 0 ? (
            <Alert
              severity="info"
              sx={{
                bgcolor: 'rgba(0,255,255,0.1)',
                color: '#0ff',
                border: '1px solid #0ff',
              }}
            >
              {showOnlyDangerous
                ? 'Нет опасных авторов. Отключите фильтр "Только опасные", чтобы увидеть всех.'
                : 'Авторы не найдены'}
            </Alert>
          ) : (
            <TableContainer
              component={Paper}
              sx={{ bgcolor: 'transparent', boxShadow: 'none' }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      Платформа
                    </TableCell>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      Имя автора
                    </TableCell>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      Опасных видео
                    </TableCell>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      Всего видео
                    </TableCell>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      Ссылка
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAuthors.map((a) => (
                    <TableRow
                      key={a.id}
                      sx={{ '&:hover': { bgcolor: 'rgba(0,255,255,0.05)' } }}
                    >
                      <TableCell sx={{ color: '#fff' }}>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          {getPlatformIcon(a.platform)}
                          {a.platform}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>{a.username}</TableCell>
                      <TableCell sx={{ color: '#ffaa44', fontWeight: 'bold' }}>
                        {a.dangerous_videos_count}
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        {a.total_videos_count}
                      </TableCell>
                      <TableCell>
                        {a.channel_url ? (
                          <a
                            href={a.channel_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#0ff', textDecoration: 'none' }}
                          >
                            Ссылка
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Box>
    </Box>
  )
}

export default FraudResources
