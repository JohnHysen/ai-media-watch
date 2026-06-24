import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  IconButton,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tooltip,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import CyberSidebar from '../components/CyberSidebar'
import { useUser } from '../context/user/useUser'
import { $host } from '../http/API'

interface Direction {
  id: number
  name: string
  keywords: string[]
  tags: string[]
}

const GeometricBackground = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      backgroundColor: '#03030f',
      overflow: 'hidden',
    }}
  >
    <Box
      component="svg"
      sx={{ width: '100%', height: '100%', opacity: 0.3 }}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
    >
      <polygon points="0,0 200,0 100,200" fill="#33ffcc" opacity="0.3" />
      <polygon points="300,0 500,0 400,300" fill="#ff3366" opacity="0.2" />
      <polygon points="600,0 800,0 700,200" fill="#ffaa44" opacity="0.25" />
      <polygon points="850,0 1000,0 900,250" fill="#aa66ff" opacity="0.2" />
      <polygon points="0,300 200,200 100,500" fill="#33ffcc" opacity="0.15" />
      <polygon points="500,500 700,400 600,700" fill="#ff3366" opacity="0.2" />
      <polygon points="200,800 400,700 300,950" fill="#ffaa44" opacity="0.25" />
      <polygon points="600,800 800,700 700,950" fill="#aa66ff" opacity="0.2" />
      <circle cx="800" cy="200" r="80" fill="#33ffcc" opacity="0.15" />
      <circle cx="200" cy="600" r="60" fill="#ff3366" opacity="0.2" />
      <circle cx="700" cy="700" r="100" fill="#ffaa44" opacity="0.15" />
      <rect
        x="100"
        y="200"
        width="40"
        height="40"
        fill="#33ffcc"
        opacity="0.2"
        transform="rotate(45, 120, 220)"
      />
      <rect
        x="800"
        y="500"
        width="50"
        height="50"
        fill="#ff3366"
        opacity="0.2"
        transform="rotate(30, 825, 525)"
      />
      <rect
        x="400"
        y="100"
        width="60"
        height="60"
        fill="#aa66ff"
        opacity="0.15"
        transform="rotate(60, 430, 130)"
      />
    </Box>
  </Box>
)

const DirectionsManagement = () => {
  const { user } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [directions, setDirections] = useState<Direction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDirection, setEditingDirection] = useState<Direction | null>(
    null
  )
  const [formName, setFormName] = useState('')
  const [formKeywords, setFormKeywords] = useState<string[]>([])
  const [formTags, setFormTags] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'ADMIN'

  const fetchDirections = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await $host.get('/directions')
      setDirections(res.data)
    } catch (err: any) {
      setError('Ошибка сервера')
      toast.error('Ошибка сервера')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchDirections()
    }
  }, [isAdmin])

  const handleAddKeyword = () => {
    const kw = newKeyword.trim()
    if (!kw) return
    if (formKeywords.includes(kw)) {
      toast.warning('Такое ключевое слово уже добавлено')
      return
    }
    setFormKeywords([...formKeywords, kw])
    setNewKeyword('')
  }

  const handleRemoveKeyword = (kw: string) => {
    setFormKeywords(formKeywords.filter((k) => k !== kw))
  }

  const handleAddTag = () => {
    const tag = newTag.trim()
    if (!tag) return
    if (formTags.includes(tag)) {
      toast.warning('Такой тег уже добавлен')
      return
    }
    setFormTags([...formTags, tag])
    setNewTag('')
  }

  const handleRemoveTag = (tag: string) => {
    setFormTags(formTags.filter((t) => t !== tag))
  }

  const openCreateDialog = () => {
    setEditingDirection(null)
    setFormName('')
    setFormKeywords([])
    setFormTags([])
    setDialogOpen(true)
  }

  const openEditDialog = (dir: Direction) => {
    setEditingDirection(dir)
    setFormName(dir.name)
    setFormKeywords([...dir.keywords])
    setFormTags([...dir.tags])
    setDialogOpen(true)
  }

  const handleSaveDirection = async () => {
    if (!formName.trim()) {
      toast.warning('Введите название направления')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: formName.trim(),
        keywords: formKeywords,
        tags: formTags,
      }
      if (editingDirection) {
        await $host.put(`/directions/${editingDirection.id}`, payload)
        toast.success('Направление обновлено')
      } else {
        await $host.post('/directions', payload)
        toast.success('Направление создано')
      }
      setDialogOpen(false)
      await fetchDirections()
    } catch (err: any) {
      toast.error('Ошибка сервера')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDirection = async (id: number) => {
    if (!window.confirm('Удалить это направление?')) return
    try {
      await $host.delete(`/directions/${id}`)
      toast.success('Направление удалено')
      await fetchDirections()
    } catch (err: any) {
      toast.error('Ошибка сервера')
    }
  }

  const handleDrawerOpen = () => setDrawerOpen(true)
  const handleDrawerClose = () => setDrawerOpen(false)

  if (!isAdmin) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          backgroundColor: '#03030f',
        }}
      >
        <Typography variant="h5">
          Доступ запрещён. Только для администраторов.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <GeometricBackground />

      {!drawerOpen && (
        <IconButton
          onClick={handleDrawerOpen}
          sx={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 1200,
            color: '#0ff',
            bgcolor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            '&:hover': { bgcolor: '#0ff', color: '#000' },
            transition: 'opacity 0.3s',
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <CyberSidebar open={drawerOpen} onClose={handleDrawerClose} />

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
            Управление направлениями
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

        <Card
          sx={{
            mb: 4,
            bgcolor: 'rgba(10,10,30,0.7)',
            backdropFilter: 'blur(8px)',
            borderRadius: 4,
            border: '1px solid rgba(0,255,255,0.3)',
            p: 3,
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
            <Typography variant="h5" sx={{ color: '#0ff' }}>
              Список направлений
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
              sx={{
                bgcolor: '#0ff',
                color: '#000',
                '&:hover': { bgcolor: '#33ffcc' },
              }}
            >
              Добавить
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#0ff' }} />
            </Box>
          ) : directions.length === 0 ? (
            <Typography sx={{ color: '#aaa', textAlign: 'center', py: 4 }}>
              Нет добавленных направлений
            </Typography>
          ) : (
            <TableContainer
              component={Paper}
              sx={{ bgcolor: 'transparent', boxShadow: 'none' }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      ID
                    </TableCell>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      Название
                    </TableCell>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      Ключевые слова
                    </TableCell>
                    <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                      Теги
                    </TableCell>
                    <TableCell
                      sx={{ color: '#0ff', fontWeight: 'bold' }}
                      align="right"
                    >
                      Действия
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {directions.map((dir) => (
                    <TableRow
                      key={dir.id}
                      sx={{ '&:hover': { bgcolor: 'rgba(0,255,255,0.05)' } }}
                    >
                      <TableCell sx={{ color: '#fff' }}>{dir.id}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{dir.name}</TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {dir.keywords.map((kw) => (
                            <Chip
                              key={kw}
                              label={kw}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(0,255,255,0.15)',
                                color: '#0ff',
                              }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {dir.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255,170,68,0.15)',
                                color: '#ffaa44',
                              }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Редактировать">
                          <IconButton
                            onClick={() => openEditDialog(dir)}
                            sx={{ color: '#0ff' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton
                            onClick={() => handleDeleteDirection(dir.id)}
                            sx={{ color: '#ff3366' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(10,10,30,0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,255,255,0.3)',
            borderRadius: 4,
            color: '#fff',
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid rgba(0,255,255,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ color: '#0ff' }}>
            {editingDirection
              ? 'Редактировать направление'
              : 'Новое направление'}
          </Typography>
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ color: '#0ff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            label="Название направления"
            fullWidth
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(0,0,0,0.4)',
                '& fieldset': { borderColor: '#0ff' },
              },
              input: { color: '#fff' },
              label: { color: '#aaa' },
            }}
          />

          <Typography sx={{ color: '#fff', mb: 1 }}>Ключевые слова</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              placeholder="Введите ключевое слово..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
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
              onClick={handleAddKeyword}
              sx={{ bgcolor: '#0ff', color: '#000' }}
            >
              <AddIcon />
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
            {formKeywords.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                onDelete={() => handleRemoveKeyword(kw)}
                sx={{
                  bgcolor: 'rgba(0,255,255,0.15)',
                  color: '#0ff',
                  border: '1px solid #0ff',
                }}
              />
            ))}
          </Box>

          <Typography sx={{ color: '#fff', mb: 1 }}>Теги</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              placeholder="Введите тег..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(0,0,0,0.4)',
                  '& fieldset': { borderColor: '#ffaa44' },
                },
                input: { color: '#fff' },
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddTag}
              sx={{ bgcolor: '#ffaa44', color: '#000' }}
            >
              <AddIcon />
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {formTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                sx={{
                  bgcolor: 'rgba(255,170,68,0.15)',
                  color: '#ffaa44',
                  border: '1px solid #ffaa44',
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{ borderTop: '1px solid rgba(0,255,255,0.2)', p: 2 }}
        >
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#aaa' }}>
            Отмена
          </Button>
          <Button
            onClick={handleSaveDirection}
            disabled={saving}
            variant="contained"
            startIcon={
              saving ? (
                <CircularProgress size={20} sx={{ color: '#000' }} />
              ) : (
                <SaveIcon />
              )
            }
            sx={{
              bgcolor: '#0ff',
              color: '#000',
              '&:hover': { bgcolor: '#33ffcc' },
            }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DirectionsManagement
