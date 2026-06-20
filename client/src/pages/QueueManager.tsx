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
import CyberSidebar from '../components/CyberSidebar'

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
  }, [items, searchTerm, priorityFilter, sortOrder])

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
        }}
      >
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
        bgcolor: '#0a0a1a',
      }}
    >
      <IconButton
        onClick={() => setDrawerOpen(true)}
        sx={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 1300,
          color: '#0ff',
        }}
      >
        <MenuIcon />
      </IconButton>
      <CyberSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Box sx={{ maxWidth: 1400, mx: 'auto', pt: 6 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" sx={{ color: '#0ff' }}>
            📋 Управление очередью
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
                    Статус
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
