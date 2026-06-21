import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material'
import { $host } from '../http/API'
import { useUser } from '../context/user/useUser'
import { toast } from 'react-toastify'
import MenuIcon from '@mui/icons-material/Menu'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import SearchIcon from '@mui/icons-material/Search'
import SortIcon from '@mui/icons-material/Sort'
import QueueIcon from '@mui/icons-material/Queue'
import CyberSidebar from '../components/CyberSidebar'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'

// ---------- 3D фон с парящими фигурами ----------
const FloatingShapes = () => {
  const groupRef = React.useRef<THREE.Group>(null!)

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

// ---------- Интерфейсы ----------
interface QueueItem {
  id: number
  url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: number
  createdAt: string
  userId: number | null
  user?: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
}

// ---------- Главный компонент ----------
const QueueManager = () => {
  const { user } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Фильтры и сортировка
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<number | 'all'>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc') // по дате

  const canManage = user?.role === 'ADMIN' || user?.role === 'INSPECTOR'

  const fetchQueue = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await $host.get('/analysis-queue')
      setItems(res.data.data || [])
    } catch (err: any) {
      console.error('Ошибка загрузки очереди:', err)
      setError('Не удалось загрузить очередь')
      toast.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManage) fetchQueue()
  }, [canManage])

  const handlePriorityChange = async (id: number, newPriority: number) => {
    if (newPriority < 0 || newPriority > 3) return
    setUpdating(id)
    try {
      await $host.put(`/analysis-queue/${id}/priority`, {
        priority: newPriority,
      })
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, priority: newPriority } : item
        )
      )
      toast.success('Приоритет обновлён')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка обновления')
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    try {
      await $host.delete(`/analysis-queue/${selectedId}`)
      setItems((prev) => prev.filter((item) => item.id !== selectedId))
      toast.success('Задача удалена')
      setDeleteDialogOpen(false)
      setSelectedId(null)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка удаления')
    }
  }

  // Фильтрация и сортировка
  const filteredAndSorted = useMemo(() => {
    let result = [...items]

    // Поиск по URL
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter((item) => item.url.toLowerCase().includes(term))
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter)
    }

    // Фильтр по приоритету
    if (priorityFilter !== 'all') {
      result = result.filter((item) => item.priority === priorityFilter)
    }

    // Сортировка по дате
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [items, searchTerm, statusFilter, priorityFilter, sortOrder])

  const toggleSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'processing':
        return 'info'
      case 'completed':
        return 'success'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'В очереди'
      case 'processing':
        return 'Обрабатывается'
      case 'completed':
        return 'Завершено'
      case 'failed':
        return 'Ошибка'
      default:
        return status
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
        <Typography variant="h5">Доступ запрещён</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        p: 3,
        color: '#fff',
      }}
    >
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
          maxWidth: 1400,
          mx: 'auto',
          pt: 6,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#0ff',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <QueueIcon /> Управление очередью
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchQueue}
            variant="outlined"
            sx={{ borderColor: '#0ff', color: '#0ff' }}
          >
            Обновить
          </Button>
        </Box>

        {/* Фильтры */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <TextField
            placeholder="Поиск по ссылке..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              flex: 1,
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(0,0,0,0.3)',
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

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: '#aaa' }}>Приоритет</InputLabel>
            <Select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as number | 'all')
              }
              sx={{
                color: '#fff',
                bgcolor: 'rgba(0,0,0,0.3)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#0ff' },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#33ffcc',
                },
              }}
            >
              <MenuItem value="all">Все</MenuItem>
              <MenuItem value={0}>0 (Макс.)</MenuItem>
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={2}>2</MenuItem>
              <MenuItem value={3}>3 (Мин.)</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={toggleSort}
            startIcon={<SortIcon />}
            endIcon={
              sortOrder === 'desc' ? (
                <ArrowDownwardIcon fontSize="small" />
              ) : (
                <ArrowUpwardIcon fontSize="small" />
              )
            }
            sx={{
              borderColor: '#0ff',
              color: '#0ff',
              '&:hover': { bgcolor: 'rgba(0,255,255,0.1)' },
            }}
          >
            {sortOrder === 'desc' ? 'Новые сначала' : 'Старые сначала'}
          </Button>
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
            sx={{ bgcolor: 'rgba(10,10,30,0.7)', backdropFilter: 'blur(8px)' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    ID
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    URL
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    {/* Фильтр по статусу в заголовке */}
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
                        <MenuItem value="pending">В очереди</MenuItem>
                        <MenuItem value="processing">Обрабатывается</MenuItem>
                        <MenuItem value="failed">Ошибка</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Приоритет
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Инициатор
                  </TableCell>
                  <TableCell
                    sx={{
                      color: '#0ff',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                    onClick={toggleSort}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      Дата создания
                      {sortOrder === 'desc' ? (
                        <ArrowDownwardIcon
                          fontSize="small"
                          sx={{ color: '#33ffcc' }}
                        />
                      ) : (
                        <ArrowUpwardIcon
                          fontSize="small"
                          sx={{ color: '#33ffcc' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Действия
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSorted.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      sx={{ textAlign: 'center', color: '#aaa' }}
                    >
                      {items.length === 0
                        ? 'Очередь пуста'
                        : 'Нет задач по выбранным фильтрам'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSorted.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ color: '#fff' }}>{item.id}</TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#0ff' }}
                        >
                          {item.url}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(item.status)}
                          color={getStatusColor(item.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Tooltip title="Уменьшить приоритет (0 — макс.)">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handlePriorityChange(
                                  item.id,
                                  Math.min(3, item.priority + 1)
                                )
                              }
                              disabled={
                                updating === item.id ||
                                item.status !== 'pending'
                              }
                              sx={{ color: '#0ff' }}
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Typography
                            sx={{
                              color: '#fff',
                              minWidth: 30,
                              textAlign: 'center',
                            }}
                          >
                            {item.priority}
                          </Typography>
                          <Tooltip title="Увеличить приоритет (0 — макс.)">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handlePriorityChange(
                                  item.id,
                                  Math.max(0, item.priority - 1)
                                )
                              }
                              disabled={
                                updating === item.id ||
                                item.status !== 'pending'
                              }
                              sx={{ color: '#0ff' }}
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {updating === item.id && (
                            <CircularProgress
                              size={16}
                              sx={{ color: '#0ff' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        {item.user
                          ? `${item.user.first_name || ''} ${item.user.last_name || ''}`.trim() ||
                            item.user.email
                          : 'Аноним'}
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        {new Date(item.createdAt).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Удалить задачу">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedId(item.id)
                              setDeleteDialogOpen(true)
                            }}
                            disabled={item.status === 'processing'}
                            sx={{ color: '#ff3366' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#111', color: '#fff', border: '1px solid #ff3366' },
        }}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          Вы уверены, что хотите удалить эту задачу из очереди?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDelete} sx={{ color: '#ff3366' }}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default QueueManager
