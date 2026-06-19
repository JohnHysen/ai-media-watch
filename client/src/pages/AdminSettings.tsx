import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Box,
  Typography,
  Card,
  IconButton,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Slider,
  CircularProgress,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SaveIcon from '@mui/icons-material/Save'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  Float,
  Environment,
  Html,
  Stars,
} from '@react-three/drei'
import * as THREE from 'three'
import CyberSidebar from '../components/CyberSidebar'
import { useUser } from '../context/user/useUser'
import { $host } from '../http/API'
import { toast } from 'react-toastify'

// ---------- 3D фон ----------
const FloatingIconsOnly = () => {
  const groupRef = useRef<THREE.Group>(null!)
  const elements = useMemo(
    () => [
      {
        symbol: '⚙️',
        color: '#33ffcc',
        size: 2.0,
        startX: -2,
        startY: 1,
        startZ: -3,
      },
      {
        symbol: '🔧',
        color: '#ffaa44',
        size: 1.8,
        startX: 3,
        startY: -1,
        startZ: -2,
      },
      {
        symbol: '📊',
        color: '#ff3366',
        size: 1.8,
        startX: 0,
        startY: 2.5,
        startZ: -4,
      },
      {
        symbol: '🛡️',
        color: '#aa66ff',
        size: 1.5,
        startX: -3,
        startY: -2,
        startZ: -3,
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

const CyberBackground3D = () => (
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

interface Settings {
  scanInterval: number
  autoRefreshNews: boolean
  newsParseInterval: number
  newsSources: string[]
}

const AdminSettings = () => {
  const { user } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    scanInterval: 5,
    autoRefreshNews: true,
    newsParseInterval: 60,
    newsSources: [],
  })
  const [newSource, setNewSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'ADMIN'

  const fetchSettings = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await $host.get('/settings')
      setSettings({
        scanInterval: res.data.scanInterval || 5,
        autoRefreshNews:
          res.data.autoRefreshNews !== undefined
            ? res.data.autoRefreshNews
            : true,
        newsParseInterval: res.data.newsParseInterval || 60,
        newsSources: res.data.newsSources || [],
      })
    } catch (err: any) {
      console.error('Ошибка загрузки настроек:', err)
      setError('Не удалось загрузить настройки')
      toast.error('Ошибка загрузки настроек')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await $host.put('/settings', settings)
      toast.success('Настройки сохранены')
    } catch (err: any) {
      console.error('Ошибка сохранения:', err)
      setError('Не удалось сохранить настройки')
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSource = () => {
    const url = newSource.trim()
    if (!url) return
    if (settings.newsSources.includes(url)) {
      toast.warning('Такой источник уже есть')
      return
    }
    setSettings((prev) => ({
      ...prev,
      newsSources: [...prev.newsSources, url],
    }))
    setNewSource('')
  }

  const handleRemoveSource = (url: string) => {
    setSettings((prev) => ({
      ...prev,
      newsSources: prev.newsSources.filter((s) => s !== url),
    }))
  }

  if (!isAdmin) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        <Typography variant="h5">
          Доступ запрещён. Только для администраторов.
        </Typography>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#0ff' }} />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <CyberBackground3D />
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
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 1200,
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
            ⚙️ Настройки системы
          </Typography>
        </motion.div>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, bgcolor: 'rgba(255,51,102,0.2)', color: '#ff8888' }}
          >
            {error}
          </Alert>
        )}

        {/* Интервал проверки видео */}
        <Card
          sx={{
            mb: 3,
            bgcolor: 'rgba(10,10,30,0.7)',
            backdropFilter: 'blur(8px)',
            borderRadius: 4,
            border: '1px solid rgba(0,255,255,0.3)',
            p: 3,
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
            🕒 Интервал автоматической проверки видео
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexWrap: 'wrap',
            }}
          >
            <Typography sx={{ color: '#fff', minWidth: 60 }}>
              {settings.scanInterval} мин.
            </Typography>
            <Slider
              value={settings.scanInterval}
              onChange={(_, val) =>
                setSettings((prev) => ({
                  ...prev,
                  scanInterval: val as number,
                }))
              }
              min={1}
              max={60}
              step={1}
              sx={{
                flex: 1,
                color: '#0ff',
                '& .MuiSlider-track': { color: '#0ff' },
                '& .MuiSlider-thumb': {
                  color: '#0ff',
                  '&:hover': { boxShadow: '0 0 20px #0ff' },
                },
              }}
            />
            <Typography sx={{ color: '#aaa' }}>(1-60 мин.)</Typography>
          </Box>
        </Card>

        {/* Автообновление новостей */}
        <Card
          sx={{
            mb: 3,
            bgcolor: 'rgba(10,10,30,0.7)',
            backdropFilter: 'blur(8px)',
            borderRadius: 4,
            border: '1px solid rgba(0,255,255,0.3)',
            p: 3,
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
            📰 Автообновление новостей
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={settings.autoRefreshNews}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    autoRefreshNews: e.target.checked,
                  }))
                }
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#0ff' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    bgcolor: '#0ff',
                  },
                }}
              />
            }
            label={settings.autoRefreshNews ? 'Включено' : 'Выключено'}
            sx={{ color: '#fff' }}
          />
        </Card>

        {/* Интервал парсинга новостей */}
        <Card
          sx={{
            mb: 3,
            bgcolor: 'rgba(10,10,30,0.7)',
            backdropFilter: 'blur(8px)',
            borderRadius: 4,
            border: '1px solid rgba(0,255,255,0.3)',
            p: 3,
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
            📡 Интервал парсинга новостей
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexWrap: 'wrap',
            }}
          >
            <Typography sx={{ color: '#fff', minWidth: 60 }}>
              {settings.newsParseInterval} мин.
            </Typography>
            <Slider
              value={settings.newsParseInterval}
              onChange={(_, val) =>
                setSettings((prev) => ({
                  ...prev,
                  newsParseInterval: val as number,
                }))
              }
              min={10}
              max={1440}
              step={5}
              sx={{
                flex: 1,
                color: '#0ff',
                '& .MuiSlider-track': { color: '#0ff' },
                '& .MuiSlider-thumb': {
                  color: '#0ff',
                  '&:hover': { boxShadow: '0 0 20px #0ff' },
                },
              }}
            />
            <Typography sx={{ color: '#aaa' }}>(10-1440 мин.)</Typography>
          </Box>
        </Card>

        {/* Источники новостей */}
        <Card
          sx={{
            mb: 3,
            bgcolor: 'rgba(10,10,30,0.7)',
            backdropFilter: 'blur(8px)',
            borderRadius: 4,
            border: '1px solid rgba(0,255,255,0.3)',
            p: 3,
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
            📰 Источники новостей (RSS)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              placeholder="Введите URL RSS-ленты..."
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSource()}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(0,0,0,0.4)',
                  '& fieldset': { borderColor: '#0ff' },
                },
                input: { color: '#fff' },
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddSource}
              sx={{
                bgcolor: '#0ff',
                color: '#000',
                '&:hover': { bgcolor: '#33ffcc' },
              }}
            >
              <AddIcon />
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {settings.newsSources.length === 0 ? (
              <Typography sx={{ color: '#aaa' }}>
                Нет добавленных источников
              </Typography>
            ) : (
              settings.newsSources.map((url, idx) => (
                <Chip
                  key={idx}
                  label={url}
                  onDelete={() => handleRemoveSource(url)}
                  sx={{
                    bgcolor: 'rgba(0,255,255,0.15)',
                    color: '#0ff',
                    border: '1px solid #0ff',
                    '& .MuiChip-deleteIcon': { color: '#ff3366' },
                  }}
                />
              ))
            )}
          </Box>
        </Card>

        {/* Кнопка сохранения */}
        <Button
          variant="contained"
          startIcon={
            saving ? (
              <RefreshIcon sx={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <SaveIcon />
            )
          }
          onClick={handleSave}
          disabled={saving}
          sx={{
            bgcolor: '#0ff',
            color: '#000',
            px: 4,
            py: 1.5,
            borderRadius: 4,
            fontSize: '1.1rem',
            '&:hover': { bgcolor: '#33ffcc' },
          }}
        >
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </Box>
    </Box>
  )
}

export default AdminSettings
