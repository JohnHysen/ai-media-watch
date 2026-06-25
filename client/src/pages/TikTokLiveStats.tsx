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
  Grid,
  Link,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RefreshIcon from '@mui/icons-material/Refresh'
import { motion } from 'framer-motion'
import CyberSidebar from '../components/CyberSidebar'
import { useTranslation } from 'react-i18next'
import { useUser } from '../context/user/useUser'
import {
  startTiktokLiveParsing,
  getTiktokLiveStatus,
  getTiktokLiveData,
  getTiktokLiveById,
  TikTokLiveRecord,
} from '../http/API'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'

// ---------- 3D фон ----------
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

const TikTokLiveStats = () => {
  const { user } = useUser()
  const { t, i18n } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [parsingActive, setParsingActive] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending: { label: t('v-ocheredi'), color: '#ffaa44' },
    processing: { label: t('obrabatyva'), color: '#0ff' },
    completed: { label: t('zaversheno'), color: '#44ff66' },
    failed: { label: t('oshibka'), color: '#ff3366' },
  }

  const fetchStatus = async () => {
    try {
      const status = await getTiktokLiveStatus()
      setParsingActive(status.processRunning || false)
    } catch (err) {
      console.error('Ошибка получения статуса парсинга:', err)
    }
  }

  const fetchLiveData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await getTiktokLiveData({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        search: searchTerm || undefined,
      })

      setLiveRecords(res.data)
      setTotalRecords(res.total)

      await fetchStatus()
    } catch (err: any) {
      console.error('Ошибка загрузки истории парсинга:', err)
      setError(t('ne-udalos-'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchLiveData()
    }
  }, [user, page, rowsPerPage, searchTerm])

  const handleStartParsing = async () => {
    setActionLoading(true)
    try {
      await startTiktokLiveParsing()
      setTimeout(() => {
        fetchLiveData()
      }, 2000)
    } catch (err: any) {
      console.error('Ошибка запуска парсинга:', err)
      setError(t('ne-udalos--5'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchLiveData()
  }

  const handleRowClick = async (id: number) => {
    setModalLoading(true)
    try {
      const res = await getTiktokLiveById(id)
      setSelectedRecord(res.data)
      setModalOpen(true)
    } catch (err) {
      console.error('Ошибка загрузки записи:', err)
    } finally {
      setModalLoading(false)
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedRecord(null)
  }

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Получение текста в зависимости от языка
  const getLocalizedText = (record: TikTokLiveRecord) => {
    const lang = i18n.language
    if (lang === 'ru' && record.reason_ru) return record.reason_ru
    if (lang === 'kz' && record.reason_kz) return record.reason_kz
    if (lang === 'en' && record.reason_en) return record.reason_en
    return record.reason_ru || record.reason_en || record.reason_kz || ''
  }

  const getLocalizedVerdict = (record: TikTokLiveRecord) => {
    const lang = i18n.language
    if (lang === 'ru') return record.verdict_text
    if (lang === 'kz') {
      const map: Record<string, string> = {
        'опасно': 'қауіпті',
        'безопасно': 'қауіпсіз',
        'неопределенно': 'белгісіз',
      }
      return map[record.verdict_text] || record.verdict_text
    }
    if (lang === 'en') {
      const map: Record<string, string> = {
        'опасно': 'dangerous',
        'безопасно': 'safe',
        'неопределенно': 'uncertain',
      }
      return map[record.verdict_text] || record.verdict_text
    }
    return record.verdict_text
  }

  // Получение цвета для вердикта
  const getVerdictColor = (verdict: string, isDangerous: boolean) => {
    if (isDangerous) return '#ff3366'
    if (verdict === 'safe' || verdict === 'безопасно' || verdict === 'қауіпсіз') return '#44ff66'
    if (verdict === 'uncertain' || verdict === 'неопределенно' || verdict === 'белгісіз') return '#ffaa44'
    return '#888'
  }

  // Получение цвета для безопасности
  const getSafetyColor = (percent: number) => {
    if (percent > 70) return '#44ff66'
    if (percent > 40) return '#ffaa44'
    return '#ff3366'
  }

  // Формирование URL для видео
  const getVideoUrl = (filename: string) => {
    if (!filename) return ''
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename
    }
    return `${import.meta.env.VITE_WS_URL}${filename.slice(1)}`
  }

  if (!ready) return null

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
              <MusicNoteIcon sx={{ fontSize: 40 }} /> {t('upravlenie-5')}
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={handleStartParsing}
                    disabled={actionLoading || parsingActive}
                    startIcon={<PlayArrowIcon />}
                    sx={{
                      bgcolor: parsingActive ? '#44ff66' : '#33ffcc',
                      color: '#000',
                      '&:hover': {
                        bgcolor: parsingActive ? '#44ff66' : '#00e676',
                      },
                      '&.Mui-disabled': {
                        bgcolor: parsingActive ? '#44ff66' : '#33ffcc',
                        color: '#000',
                        opacity: 0.7,
                      },
                    }}
                  >
                    {parsingActive ? t('ostanovit-') : t('zapustit-p')}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleRefresh}
                    startIcon={<RefreshIcon />}
                    sx={{ borderColor: '#ffaa44', color: '#ffaa44' }}
                  >
                    {t('obnovit')}
                  </Button>
                  <Chip
                    label={parsingActive ? t('parsing-ak') : t('parsing-os')}
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
                  {t('vsego-v-oc')}{' '}
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
              placeholder={t('poisk-po-s-0')}
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
                    {t('kanal')}
                  </TableCell>
                  <TableCell sx={{ color: '#ffaa44', fontWeight: 'bold' }}>
                    {t('ssylka-na--0')}
                  </TableCell>
                  <TableCell sx={{ color: '#ffaa44', fontWeight: 'bold' }}>
                    {t('data-dobav')}
                  </TableCell>
                  <TableCell sx={{ color: '#ffaa44', fontWeight: 'bold' }}>
                    {t('status')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: '#ffaa44' }} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ py: 4, color: '#ff3366' }}
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : liveRecords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ py: 4, color: '#aaa' }}
                    >
                      {searchTerm ? t('nichego-ne') : t('istoriya-p-0')}
                    </TableCell>
                  </TableRow>
                ) : (
                  liveRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      onClick={() => handleRowClick(record.id)}
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(255,170,68,0.1)',
                          cursor: 'pointer',
                        },
                      }}
                    >
                      <TableCell sx={{ color: '#fff' }}>
                        {record.authorName || 'Unknown'}
                      </TableCell>
                      <TableCell sx={{ color: '#88f' }}>
                        <Link
                          href={import.meta.env.VITE_API_URL + record.video_url.slice(1)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            color: '#88f',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          Перейти к видео
                        </Link>
                      </TableCell>
                      <TableCell sx={{ color: '#aaa', fontSize: '0.85rem' }}>
                        {new Date(record.checked_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getLocalizedVerdict(record)}
                          size="small"
                          sx={{
                            bgcolor: getVerdictColor(
                              record.verdict_text,
                              record.is_dangerous
                            ),
                            color: '#fff',
                            fontWeight: 'bold',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${Math.round(record.safety_percent)}%`}
                          size="small"
                          sx={{
                            bgcolor: getSafetyColor(record.safety_percent),
                            color: '#fff',
                            fontWeight: 'bold',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#aaa', fontSize: '0.85rem' }}>
                        {Math.round(record.duration_seconds)} сек
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalRecords}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              color: '#fff',
              '& .MuiTablePagination-selectIcon': { color: '#fff' },
              '& .MuiTablePagination-select': { color: '#fff' },
              '& .MuiTablePagination-actions button': { color: '#fff' },
            }}
          />
        </Container>
      </Box>

      {/* Модалка с видео */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(10,10,30,0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: 3,
            border: '1px solid rgba(255,170,68,0.3)',
          },
        }}
      >
        <DialogTitle
          sx={{
            color: '#ffaa44',
            borderBottom: '1px solid rgba(255,170,68,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          Видео анализ
          {selectedRecord && (
            <Chip
              label={getLocalizedVerdict(selectedRecord)}
              size="small"
              sx={{
                bgcolor: getVerdictColor(
                  selectedRecord.verdict_text,
                  selectedRecord.is_dangerous
                ),
                color: '#fff',
                fontWeight: 'bold',
              }}
            />
          )}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {modalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#ffaa44' }} />
            </Box>
          ) : selectedRecord ? (
            <Box>
              {/* ВИДЕО ПЛЕЕР */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  bgcolor: '#000',
                  borderRadius: 2,
                  overflow: 'hidden',
                  mb: 3,
                  aspectRatio: '16/9',
                }}
              >
                {selectedRecord.authorName ? (
                  <video
                    controls
                    autoPlay
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'block',
                    }}
                  >
                    <source 
                      src={getVideoUrl(selectedRecord.video_url)} 
                      type="video/mp4" 
                    />
                    Ваш браузер не поддерживает видео
                  </video>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#666',
                    }}
                  >
                    <Typography>Видео недоступно</Typography>
                  </Box>
                )}
              </Box>

              {/* Детали */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    Автор
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>
                    {selectedRecord.authorName || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    Безопасность
                  </Typography>
                  <Typography
                    sx={{
                      color: getSafetyColor(selectedRecord.safety_percent),
                      fontWeight: 'bold',
                    }}
                  >
                    {Math.round(selectedRecord.safety_percent)}%
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    Ссылка
                  </Typography>
                  <Link
                    href={selectedRecord.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#88f',
                      display: 'block',
                      wordBreak: 'break-all',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {selectedRecord.video_url}
                  </Link>
                </Grid>
                {selectedRecord.primary_risk && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" sx={{ color: '#888' }}>
                      Основной риск
                    </Typography>
                    <Typography sx={{ color: '#ffaa44' }}>
                      {selectedRecord.primary_risk}
                    </Typography>
                  </Grid>
                )}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    Причина
                  </Typography>
                  <Typography
                    sx={{
                      color: '#ccc',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      p: 1,
                      borderRadius: 1,
                      mt: 0.5,
                    }}
                  >
                    {getLocalizedText(selectedRecord)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    Длительность
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>
                    {Math.round(selectedRecord.duration_seconds)} сек
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    ID записи
                  </Typography>
                  <Typography sx={{ color: '#aaa', fontSize: '0.85rem' }}>
                    #{selectedRecord.id}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    Дата проверки
                  </Typography>
                  <Typography sx={{ color: '#aaa' }}>
                    {new Date(selectedRecord.checked_at).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: '1px solid rgba(255,170,68,0.2)',
            p: 2,
          }}
        >
          <Button
            onClick={handleCloseModal}
            sx={{
              color: '#ffaa44',
              '&:hover': { bgcolor: 'rgba(255,170,68,0.1)' },
            }}
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default TikTokLiveStats