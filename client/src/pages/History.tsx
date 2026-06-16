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
  Button,
  ButtonGroup,
  Alert,
  Link,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import HistoryIcon from '@mui/icons-material/History'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import PersonIcon from '@mui/icons-material/Person'
import PeopleIcon from '@mui/icons-material/People'
import { useUser } from '../context/user/useUser'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'
import CyberSidebar from '../components/CyberSidebar'
import {
  getVideoAnalyses,
  getVideoAnalysesByUser,
  VideoAnalysis,
} from '../http/API'

// ---------- Фон с вращающимися кубами ----------
const FloatingCube = ({ position, color, size, speed }) => {
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

// Маппинг вердиктов для цветовой индикации
const VERDICT_MAP = {
  safe: { label: 'Безопасно', color: '#44ff66' },
  dangerous: { label: 'Опасно', color: '#ff3366' },
  uncertain: { label: 'Неопределённо', color: '#ffaa44' },
}

// ---------- Главный компонент ----------
const History = () => {
  const { user } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [mode, setMode] = useState<'my' | 'all'>('my')
  const [videoAnalyses, setVideoAnalyses] = useState<VideoAnalysis[]>([])
  const [totalCount, setTotalCount] = useState(0)

  const isAdmin = user?.role === 'ADMIN'
  const isAuthenticated = user && user.user_id !== -1 && user.role !== null

  // Логи для отладки
  console.log('👤 user в History:', user)
  console.log('📌 user.user_id:', user?.user_id)
  console.log('🔐 isAdmin:', isAdmin)

  const fetchData = async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      let data: VideoAnalysis[] = []
      if (mode === 'my') {
        const userId = user.user_id ?? user.id
        console.log(`🔍 Загрузка проверок для пользователя ${userId}`)
        data = await getVideoAnalysesByUser(userId)
        console.log(`📊 Получено ${data.length} записей`)
      } else if (mode === 'all') {
        console.log('🌐 Загрузка всех проверок')
        const response = await getVideoAnalyses({ limit: 1000, offset: 0 })
        data = response.data
        console.log(`📊 Получено ${data.length} записей`)
      }
      setVideoAnalyses(data)
      setTotalCount(data.length)
    } catch (err: any) {
      console.error('❌ Ошибка загрузки истории:', err)
      setError('Не удалось загрузить данные: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user, mode])

  const filteredAndPaginated = useMemo(() => {
    let filtered = [...videoAnalyses]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(term)) ||
          item.video_url.toLowerCase().includes(term)
      )
    }
    filtered.sort((a, b) => {
      const dateA = new Date(a.checked_at).getTime()
      const dateB = new Date(b.checked_at).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })
    setTotalCount(filtered.length)
    const start = page * rowsPerPage
    const end = start + rowsPerPage
    return filtered.slice(start, end)
  }, [videoAnalyses, searchTerm, sortOrder, page, rowsPerPage])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')
    setPage(0)
  }

  const handleModeToggle = (newMode: 'my' | 'all') => {
    setMode(newMode)
    setPage(0)
  }

  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#03030f',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography>Пожалуйста, войдите в систему</Typography>
      </Box>
    )
  }

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
                background: 'linear-gradient(135deg, #ff3366, #33ffcc)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textAlign: 'center',
              }}
            >
              {mode === 'my' ? 'Мои проверки' : 'Все проверки'}
            </Typography>
          </motion.div>

          {/* Две кнопки переключения – теперь обе активны для всех */}
          <Box
            sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 4 }}
          >
            <Button
              variant={mode === 'my' ? 'contained' : 'outlined'}
              onClick={() => handleModeToggle('my')}
              startIcon={<PersonIcon />}
              sx={{
                borderRadius: '50px',
                px: 4,
                py: 1.5,
                borderColor: '#33ffcc',
                color: mode === 'my' ? '#000' : '#33ffcc',
                bgcolor: mode === 'my' ? '#33ffcc' : 'transparent',
                boxShadow:
                  mode === 'my' ? '0 0 30px rgba(51,255,204,0.5)' : 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 50px rgba(51,255,204,0.8)',
                },
                fontWeight: 'bold',
                fontSize: '1.1rem',
              }}
            >
              👤 Мои проверки
            </Button>
            <Button
              variant={mode === 'all' ? 'contained' : 'outlined'}
              onClick={() => handleModeToggle('all')}
              // ✅ Убрано disabled={!isAdmin}
              startIcon={<PeopleIcon />}
              sx={{
                borderRadius: '50px',
                px: 4,
                py: 1.5,
                borderColor: '#ff3366',
                color: mode === 'all' ? '#fff' : '#ff3366',
                bgcolor: mode === 'all' ? '#ff3366' : 'transparent',
                boxShadow:
                  mode === 'all' ? '0 0 30px rgba(255,51,102,0.5)' : 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 50px rgba(255,51,102,0.8)',
                },
                '&.Mui-disabled': {
                  opacity: 0.4,
                  color: '#666',
                  borderColor: '#666',
                },
                fontWeight: 'bold',
                fontSize: '1.1rem',
              }}
            >
              🌐 Все проверки
            </Button>
          </Box>

          {/* Карточка статистики */}
          <Card
            sx={{
              mb: 4,
              bgcolor: 'rgba(10,10,30,0.6)',
              backdropFilter: 'blur(12px)',
              borderRadius: 4,
              border: '1px solid rgba(0,255,255,0.3)',
              p: 2,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <HistoryIcon sx={{ fontSize: 48, color: '#0ff' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Всего записей
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ color: '#33ffcc', fontWeight: 'bold' }}
                    >
                      {totalCount}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Сортировка:
                  </Typography>
                  <ButtonGroup variant="outlined" size="small">
                    <Button
                      onClick={handleSortToggle}
                      startIcon={
                        sortOrder === 'newest' ? (
                          <TrendingDownIcon />
                        ) : (
                          <TrendingUpIcon />
                        )
                      }
                      sx={{
                        borderColor: '#0ff',
                        color: sortOrder === 'newest' ? '#0ff' : '#aaa',
                        '&:hover': {
                          borderColor: '#0ff',
                          bgcolor: 'rgba(0,255,255,0.1)',
                        },
                      }}
                    >
                      {sortOrder === 'newest'
                        ? 'Сначала новые'
                        : 'Сначала старые'}
                    </Button>
                  </ButtonGroup>
                </Box>
              </Grid>
            </Grid>
          </Card>

          {/* Поле поиска */}
          <TextField
            placeholder="Поиск по названию или ссылке..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            size="small"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '30px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                '& fieldset': { borderColor: '#555' },
                '&:hover fieldset': { borderColor: '#0ff' },
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
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Название
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Ссылка
                  </TableCell>
                  <TableCell
                    sx={{ color: '#0ff', fontWeight: 'bold' }}
                    align="center"
                  >
                    Безопасность (%)
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Вердикт
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Дата проверки
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: '#0ff' }} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 4, color: '#ff3366' }}
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredAndPaginated.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 4, color: '#aaa' }}
                    >
                      {searchTerm
                        ? 'Ничего не найдено'
                        : 'Нет данных о проверках'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndPaginated.map((item) => {
                    const verdictInfo = VERDICT_MAP[item.verdict_text] || {
                      label: item.verdict_text,
                      color: '#aaa',
                    }
                    return (
                      <TableRow
                        key={item.id}
                        sx={{ '&:hover': { bgcolor: 'rgba(0,255,255,0.05)' } }}
                      >
                        <TableCell sx={{ color: '#fff' }}>
                          {item.title || 'Без названия'}
                        </TableCell>
                        <TableCell sx={{ color: '#88f' }}>
                          <Link
                            href={item.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: '#88f',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {item.video_url.length > 50
                              ? item.video_url.substring(0, 50) + '...'
                              : item.video_url}
                          </Link>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${item.safety_percent}%`}
                            size="small"
                            sx={{
                              bgcolor:
                                item.safety_percent < 40
                                  ? '#ff3366'
                                  : item.safety_percent < 70
                                    ? '#ffaa44'
                                    : '#44ff66',
                              color: '#fff',
                              fontWeight: 'bold',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={verdictInfo.label}
                            size="small"
                            sx={{
                              bgcolor: verdictInfo.color,
                              color: '#000',
                              fontWeight: 'bold',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#aaa', fontSize: '0.85rem' }}>
                          {new Date(item.checked_at).toLocaleString()}
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

export default History
