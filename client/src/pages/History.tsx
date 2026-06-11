import React, { useState, useEffect } from 'react'
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
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import HistoryIcon from '@mui/icons-material/History'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { useUser } from '../context/user/useUser'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'
import CyberSidebar from '../components/CyberSidebar'

// ---------- Компонент вращающегося куба ----------
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

// ---------- Космический фон с кубами ----------
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

// Типы угроз для цветовой индикации
const threatTypes = {
  casino: { label: 'Нелегальное казино', color: '#ff3366' },
  pyramid: { label: 'Финансовая пирамида', color: '#ffaa44' },
  gambling: { label: 'Азарт без лицензии', color: '#ff8844' },
  guaranteed: { label: 'Гарантированный доход', color: '#ff6666' },
  referral: { label: 'Реферальная схема', color: '#ff9966' },
  crypto_scam: { label: 'Крипто-мошенничество', color: '#ff44aa' },
}

// Генерация тестовых данных (заглушка)
const generateMockHistory = () => {
  const platforms = ['tiktok', 'instagram', 'youtube']
  const titles = [
    'Заработай 500% за день!',
    'Инвестируй 1000→10000',
    'Секретная стратегия казино',
    'Пассивный доход 50% в месяц',
    'Крути барабан и выигрывай iPhone',
    'Крипто-халява с гарантией',
    'Бинарные опционы прибыль 90%',
    'Удвой депозит за час',
  ]
  const threats = [
    'casino',
    'pyramid',
    'gambling',
    'guaranteed',
    'referral',
    'crypto_scam',
  ]
  const history = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getTime() - i * 86400000) // последние 24 дня
    history.push({
      id: i + 1,
      title: titles[i % titles.length] + ` (${i + 1})`,
      url: `https://${platforms[i % 3]}.com/video/${i + 1}`,
      risk: 50 + Math.floor(Math.random() * 50),
      threatType: threats[i % threats.length],
      checkedAt: date.toISOString(),
    })
  }
  return history
}

// ---------- Главный компонент History ----------
const History = () => {
  const { user } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' или 'oldest'

  // Загрузка данных (пока заглушка, потом заменить на API)
  useEffect(() => {
    if (!user) return
    setLoading(true)
    // TODO: заменить на реальный API-вызов
    // const response = await fetch(`/api/user/history?page=${page}&limit=${rowsPerPage}&search=${searchTerm}&sort=${sortOrder}`)
    // const data = await response.json()
    // setHistory(data.items)
    // setTotalCount(data.total)
    setTimeout(() => {
      let mock = generateMockHistory()
      // Фильтрация по поиску
      if (searchTerm) {
        mock = mock.filter(
          (item) =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.url.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      // Сортировка
      mock.sort((a, b) => {
        const dateA = new Date(a.checkedAt)
        const dateB = new Date(b.checkedAt)
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
      })
      setTotalCount(mock.length)
      // Пагинация
      const paginated = mock.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      )
      setHistory(paginated)
      setLoading(false)
    }, 500)
  }, [user, page, rowsPerPage, searchTerm, sortOrder])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')
    setPage(0)
  }

  if (!user) {
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
        {/* Кнопка бургер-меню */}
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
              }}
            >
              История проверок
            </Typography>
          </motion.div>

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
                      Всего проверено видео
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

          {/* Таблица истории */}
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
                    Название видео
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Ссылка
                  </TableCell>
                  <TableCell
                    sx={{ color: '#0ff', fontWeight: 'bold' }}
                    align="center"
                  >
                    Риск (%)
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Тип угрозы
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
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 4, color: '#aaa' }}
                    >
                      Нет данных о проверках
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow
                      key={item.id}
                      sx={{ '&:hover': { bgcolor: 'rgba(0,255,255,0.05)' } }}
                    >
                      <TableCell sx={{ color: '#fff' }}>{item.title}</TableCell>
                      <TableCell sx={{ color: '#88f' }}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#88f', textDecoration: 'none' }}
                        >
                          {item.url.length > 50
                            ? item.url.substring(0, 50) + '...'
                            : item.url}
                        </a>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${item.risk}%`}
                          size="small"
                          sx={{
                            bgcolor:
                              item.risk > 70
                                ? '#ff3366'
                                : item.risk > 40
                                  ? '#ffaa44'
                                  : '#44ff66',
                            color: '#fff',
                            fontWeight: 'bold',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            threatTypes[item.threatType]?.label ||
                            item.threatType
                          }
                          size="small"
                          sx={{
                            bgcolor:
                              threatTypes[item.threatType]?.color || '#aaa',
                            color: '#fff',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#aaa', fontSize: '0.85rem' }}>
                        {new Date(item.checkedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Пагинация */}
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
