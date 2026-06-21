import React, { useState, useEffect } from 'react'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import MenuIcon from '@mui/icons-material/Menu'
import YouTubeIcon from '@mui/icons-material/YouTube'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import InstagramIcon from '@mui/icons-material/Instagram'
import { motion } from 'framer-motion'
import { $host } from '../http/API'
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

// ---------- Интерфейс ресурса ----------
interface FraudResource {
  id: number
  platform: 'youtube' | 'tiktok' | 'instagram' | 'unknown'
  username: string
  channel_url: string | null
  display_name: string | null
  status: 'pending' | 'confirmed' | 'dismissed' | 'blocked'
  dangerous_videos_count: number
  description: string | null
  moderator_comment: string | null
  addedByUser?: { first_name: string; last_name: string; email: string }
  verifiedByUser?: { first_name: string; last_name: string; email: string }
  createdAt: string
  verified_at: string | null
  tags: string | null
}

// ---------- Главный компонент ----------
const FraudResources = () => {
  const { user } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [resources, setResources] = useState<FraudResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    platform: 'youtube',
    channel_name: '',
    channel_url: '',
    description: '',
    status: 'pending' as any,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const isAdmin = user?.role === 'ADMIN'
  const isInspector = user?.role === 'INSPECTOR'
  const canManage = isAdmin || isInspector

  // ---------- Загрузка данных ----------
  const fetchResources = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (platformFilter) params.append('platform', platformFilter)
      const res = await $host.get(`/fraud-resources?${params.toString()}`)
      setResources(res.data.data || [])
    } catch (err: any) {
      console.error('Ошибка загрузки реестра:', err)
      setError(err.response?.data?.error || 'Не удалось загрузить реестр')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManage) fetchResources()
  }, [search, statusFilter, platformFilter, canManage])

  // ---------- Модальное окно ----------
  const handleOpenModal = (resource?: FraudResource) => {
    if (resource) {
      setEditingId(resource.id)
      setFormData({
        platform: resource.platform,
        channel_name: resource.display_name || resource.username || '',
        channel_url: resource.channel_url || '',
        description: resource.description || '',
        status: resource.status,
      })
    } else {
      setEditingId(null)
      setFormData({
        platform: 'youtube',
        channel_name: '',
        channel_url: '',
        description: '',
        status: 'pending',
      })
    }
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload = {
        platform: formData.platform,
        username: formData.channel_name, // дублируем в username
        display_name: formData.channel_name,
        channel_url: formData.channel_url,
        description: formData.description,
        status: formData.status,
      }
      if (editingId) {
        await $host.put(`/fraud-resources/${editingId}`, payload)
        toast.success('Автор обновлён')
      } else {
        await $host.post('/fraud-resources', payload)
        toast.success('Автор добавлен')
      }
      setModalOpen(false)
      fetchResources()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка сохранения')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await $host.delete(`/fraud-resources/${deleteId}`)
      toast.success('Автор удалён')
      setDeleteDialogOpen(false)
      setDeleteId(null)
      fetchResources()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка удаления')
    }
  }

  // ---------- Вспомогательные функции ----------
  const getStatusChip = (status: string) => {
    const map: Record<string, { label: string; color: any }> = {
      pending: { label: 'Ожидает', color: 'warning' },
      confirmed: { label: 'Подтверждён', color: 'error' },
      dismissed: { label: 'Отклонён', color: 'default' },
      blocked: { label: 'Заблокирован', color: 'error' },
    }
    const info = map[status] || map.pending
    return <Chip label={info.label} color={info.color} size="small" />
  }

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

  const getChannelName = (resource: FraudResource) => {
    return resource.display_name || resource.username || '—'
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
            Реестр мошеннических каналов
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
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => handleOpenModal()}
              sx={{
                bgcolor: '#0ff',
                color: '#000',
                '&:hover': { bgcolor: '#33ffcc' },
              }}
            >
              Добавить автора
            </Button>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchResources}
              variant="outlined"
              sx={{ borderColor: '#0ff', color: '#0ff' }}
            >
              Обновить
            </Button>
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
                      Имя канала
                    </TableCell>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          sx={{
                            color: '#0ff',
                            '& .MuiSelect-icon': { color: '#0ff' },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(0,255,255,0.3)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#0ff',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#0ff',
                            },
                          }}
                        >
                          <MenuItem value="all">Все</MenuItem>
                          <MenuItem value="pending">Ожидает</MenuItem>
                          <MenuItem value="confirmed">Подтверждён</MenuItem>
                          <MenuItem value="dismissed">Отклонён</MenuItem>
                          <MenuItem value="blocked">Заблокирован</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      Опасных видео
                    </TableCell>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      Добавил
                    </TableCell>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      Действия
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resources.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ textAlign: 'center', color: '#aaa' }}
                      >
                        Каналы не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    resources.map((r) => (
                      <TableRow
                        key={r.id}
                        sx={{ '&:hover': { bgcolor: 'rgba(0,255,255,0.05)' } }}
                      >
                        <TableCell sx={{ color: '#fff' }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {getPlatformIcon(r.platform)}
                            {r.platform}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {getChannelName(r)}
                        </TableCell>
                        <TableCell>{getStatusChip(r.status)}</TableCell>
                        <TableCell
                          sx={{ color: '#ffaa44', fontWeight: 'bold' }}
                        >
                          {r.dangerous_videos_count}
                        </TableCell>
                        <TableCell sx={{ color: '#aaa' }}>
                          {r.addedByUser
                            ? `${r.addedByUser.first_name || ''} ${r.addedByUser.last_name || ''}`.trim() ||
                              r.addedByUser.email
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Редактировать">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenModal(r)}
                              sx={{ color: '#0ff' }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {isAdmin && (
                            <Tooltip title="Удалить">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setDeleteId(r.id)
                                  setDeleteDialogOpen(true)
                                }}
                                sx={{ color: '#ff3366' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Box>

      {/* Модальное окно добавления/редактирования с прокруткой */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(5,5,20,0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,255,255,0.3)',
            color: '#fff',
          },
        }}
      >
        <DialogTitle
          sx={{ borderBottom: '1px solid rgba(0,255,255,0.2)', color: '#0ff' }}
        >
          {editingId ? 'Редактировать автора' : 'Добавить автора'}
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto', mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <Select
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value })
                }
                sx={{
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#0ff' },
                }}
              >
                <MenuItem value="youtube">YouTube</MenuItem>
                <MenuItem value="tiktok">TikTok</MenuItem>
                <MenuItem value="instagram">Instagram</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Имя канала"
              value={formData.channel_name}
              onChange={(e) =>
                setFormData({ ...formData, channel_name: e.target.value })
              }
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#0ff' },
                },
                input: { color: '#fff' },
                label: { color: '#aaa' },
              }}
            />
            <TextField
              label="URL канала/профиля"
              value={formData.channel_url}
              onChange={(e) =>
                setFormData({ ...formData, channel_url: e.target.value })
              }
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#0ff' },
                },
                input: { color: '#fff' },
                label: { color: '#aaa' },
              }}
            />
            <TextField
              label="Описание"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#0ff' },
                },
                input: { color: '#fff' },
                label: { color: '#aaa' },
              }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#aaa' }}>Статус</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                label="Статус"
                sx={{
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#0ff' },
                }}
              >
                <MenuItem value="pending">Ожидает</MenuItem>
                <MenuItem value="confirmed">Подтверждён</MenuItem>
                <MenuItem value="dismissed">Отклонён</MenuItem>
                <MenuItem value="blocked">Заблокирован</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{ borderTop: '1px solid rgba(0,255,255,0.2)', p: 2 }}
        >
          <Button onClick={() => setModalOpen(false)} sx={{ color: '#aaa' }}>
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              bgcolor: '#0ff',
              color: '#000',
              '&:hover': { bgcolor: '#33ffcc' },
            }}
          >
            {editingId ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(5,5,20,0.95)',
            border: '1px solid #ff3366',
            color: '#fff',
          },
        }}
      >
        <DialogTitle sx={{ color: '#ff3366' }}>
          Подтверждение удаления
        </DialogTitle>
        <DialogContent>
          Вы уверены, что хотите удалить этого автора из реестра?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: '#aaa' }}
          >
            Отмена
          </Button>
          <Button onClick={handleDelete} sx={{ color: '#ff3366' }}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FraudResources
