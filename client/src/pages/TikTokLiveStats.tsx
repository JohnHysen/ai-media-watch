import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Container,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  TablePagination,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Link,
  Button,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import RefreshIcon from '@mui/icons-material/Refresh'
import { motion } from 'framer-motion'
import CyberSidebar from '../components/CyberSidebar'
import { useTranslation } from 'react-i18next'
import { useUser } from '../context/user/useUser'
import {
  getTiktokLiveQueue,
  startTiktokLiveParsing,
  stopTiktokLiveParsing,
  getTiktokLiveStatus,
  QueueItem,
} from '../http/API'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'

// ---------- 3D фон (без изменений) ----------
const FloatingRings = ({ position, color, size, speed }: any) => {
  const meshRef = React.useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * speed * 0.3
      meshRef.current.rotation.y = clock.getElapsedTime() * speed * 0.5
      meshRef.current.position.y =
        position[1] + Math.sin(clock.getElapsedTime() * 0.5) * 0.3
    }
  })
  return (
    <mesh ref={meshRef} position={position}>
      <torusGeometry args={[size, size * 0.15, 16, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        metalness={0.7}
        roughness={0.2}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

const RingSpaceBackground = () => {
  const rings = [
    { color: '#ff8844', size: 1.2, position: [-3, 0, -8], speed: 0.25 },
    { color: '#ffaa44', size: 1.6, position: [4, 2, -10], speed: 0.15 },
    { color: '#ff6633', size: 0.9, position: [1, -2, -12], speed: 0.35 },
    { color: '#ff9933', size: 1.4, position: [-2, 3, -15], speed: 0.2 },
    { color: '#ffcc44', size: 1.1, position: [5, -1, -18], speed: 0.3 },
    { color: '#ff7733', size: 0.7, position: [-4, -2, -20], speed: 0.4 },
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
      <Canvas camera={{ position: [0, 1, 14], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.6} />
        <pointLight position={[-5, -5, 5]} color="#ff8844" intensity={0.3} />
        {rings.map((ring, idx) => (
          <FloatingRings key={idx} {...ring} />
        ))}
        <Stars
          radius={120}
          depth={70}
          count={2500}
          factor={5}
          saturation={0}
          fade
          speed={0.15}
        />
        <Environment preset="night" />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.05}
          target={[0, 0, 0]}
        />
      </Canvas>
    </Box>
  )
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'В очереди', color: '#ffaa44' },
  processing: { label: 'Обрабатывается', color: '#0ff' },
  completed: { label: 'Завершено', color: '#44ff66' },
  failed: { label: 'Ошибка', color: '#ff3366' },
}

const TikTokLiveStats = () => {
  const { user } = useUser()
  const { t } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [parsingActive, setParsingActive] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchStatus = async () => {
    try {
      const status = await getTiktokLiveStatus()
      setParsingActive(status.processRunning || false)
    } catch (err) {
      console.error('Ошибка получения статуса парсинга:', err)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getTiktokLiveQueue({ limit: 1000, offset: 0 })
      setQueueItems(res.data)
      setTotalCount(res.total)
      await fetchStatus()
    } catch (err: any) {
      console.error('Ошибка загрузки истории парсинга:', err)
      setError('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const handleStartParsing = async () => {
    setActionLoading(true)
    try {
      await startTiktokLiveParsing()
      await fetchData()
    } catch (err: any) {
      console.error('Ошибка запуска парсинга:', err)
      setError('Не удалось запустить парсинг')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStopParsing = async () => {
    setActionLoading(true)
    try {
      await stopTiktokLiveParsing()
      await fetchData()
    } catch (err: any) {
      console.error('Ошибка остановки парсинга:', err)
      setError('Не удалось остановить парсинг')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchData()
  }

  // Фильтрация и пагинация
  const filteredAndPaginated = useMemo(() => {
    let filtered = [...queueItems]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.url.toLowerCase().includes(term) ||
          item.User?.first_name?.toLowerCase().includes(term) ||
          item.User?.email?.toLowerCase().includes(term)
      )
    }
    setTotalCount(filtered.length)
    const start = page * rowsPerPage
    const end = start + rowsPerPage
    return filtered.slice(start, end)
  }, [queueItems, searchTerm, page, rowsPerPage])

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getChannel = (url: string) => {
    const match = url.match(/https?:\/\/(?:www\.)?tiktok\.com\/@([^\/]+)\/live/)
    return match ? `@${match[1]}` : url
  }

  return (
    <>
      <RingSpaceBackground />
      <Box sx={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 1300,
            color: '#ffaa44',
            bgcolor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            '&:hover': { bgcolor: '#ffaa44', color: '#000' },
          }}
        >
          <MenuIcon />
        </IconButton>

        <CyberSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <Container maxWidth="lg" sx={{ pt: 8, pb: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                background: 'linear-gradient(135deg, #ff8844, #ffaa44)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <MusicNoteIcon sx={{ fontSize: 40 }} /> Управление парсингом
              TikTok Live
            </Typography>
          </motion.div>

          {/* Карточка управления */}
          <Card
            sx={{
              mb: 3,
              bgcolor: 'rgba(10,10,30,0.6)',
              backdropFilter: 'blur(12px)',
              borderRadius: 4,
              border: '1px solid rgba(255,170,68,0.3)',
              p: 2,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={
                      parsingActive ? handleStopParsing : handleStartParsing
                    }
                    disabled={actionLoading}
                    startIcon={parsingActive ? <StopIcon /> : <PlayArrowIcon />}
                    sx={{
                      bgcolor: parsingActive ? '#ff3366' : '#33ffcc',
                      color: '#000',
                      '&:hover': {
                        bgcolor: parsingActive ? '#cc0044' : '#00e676',
                      },
                    }}
                  >
                    {parsingActive ? 'Остановить парсинг' : 'Запустить парсинг'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleRefresh}
                    startIcon={<RefreshIcon />}
                    sx={{ borderColor: '#ffaa44', color: '#ffaa44' }}
                  >
                    Обновить
                  </Button>
                  <Chip
                    label={
                      parsingActive ? 'Парсинг активен' : 'Парсинг остановлен'
                    }
                    sx={{
                      bgcolor: parsingActive ? '#44ff66' : '#ff6666',
                      color: '#000',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="body2"
                  sx={{ color: '#aaa', textAlign: 'right' }}
                >
                  Всего в очереди:{' '}
                  <strong style={{ color: '#ffaa44' }}>{totalCount}</strong>
                </Typography>
              </Grid>
            </Grid>
          </Card>

          {/* Поиск */}
          <Card
            sx={{
              mb: 3,
              bgcolor: 'rgba(10,10,30,0.6)',
              backdropFilter: 'blur(12px)',
              borderRadius: 4,
              border: '1px solid rgba(255,170,68,0.3)',
              p: 2,
            }}
          >
            <TextField
              placeholder="Поиск по ссылке или пользователю..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '30px',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  '& fieldset': { borderColor: '#555' },
                  '&:hover fieldset': { borderColor: '#ffaa44' },
                },
                input: { color: '#fff' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#ffaa44' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Card>

          {/* Таблица */}
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: 'rgba(10,10,30,0.7)',
              backdropFilter: 'blur(8px)',
              borderRadius: 3,
              overflowX: 'auto',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#ffaa44', fontWeight: 'bold' }}>
                    Канал
                  </TableCell>
                  <TableCell sx={{ color: '#ffaa44', fontWeight: 'bold' }}>
                    Ссылка на стрим
                  </TableCell>
                  <TableCell sx={{ color: '#ffaa44', fontWeight: 'bold' }}>
                    Дата добавления
                  </TableCell>
                  <TableCell sx={{ color: '#ffaa44', fontWeight: 'bold' }}>
                    Статус
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: '#ffaa44' }} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ py: 4, color: '#ff3366' }}
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredAndPaginated.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ py: 4, color: '#aaa' }}
                    >
                      {searchTerm
                        ? 'Ничего не найдено'
                        : 'История парсинга пуста'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndPaginated.map((item) => {
                    const statusInfo = STATUS_MAP[item.status] || {
                      label: item.status,
                      color: '#aaa',
                    }
                    return (
                      <TableRow
                        key={item.id}
                        sx={{ '&:hover': { bgcolor: 'rgba(255,170,68,0.05)' } }}
                      >
                        <TableCell sx={{ color: '#fff' }}>
                          {getChannel(item.url)}
                        </TableCell>
                        <TableCell sx={{ color: '#88f' }}>
                          <Link
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: '#88f',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {item.url.length > 50
                              ? item.url.substring(0, 50) + '...'
                              : item.url}
                          </Link>
                        </TableCell>
                        <TableCell sx={{ color: '#aaa', fontSize: '0.85rem' }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.label}
                            size="small"
                            sx={{
                              bgcolor: statusInfo.color,
                              color: '#fff',
                              fontWeight: 'bold',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              color: '#fff',
              '& .MuiTablePagination-selectIcon': { color: '#fff' },
            }}
          />
        </Container>
      </Box>
    </>
  )
}

export default TikTokLiveStats
