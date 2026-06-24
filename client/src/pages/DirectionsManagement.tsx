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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  SelectChangeEvent,
  Slider,
  Divider,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import CyberSidebar from '../components/CyberSidebar'
import { useUser } from '../context/user/useUser'
import { $host } from '../http/API'

interface Direction {
  id: number
  name: string
  name_kk: string | null
  name_en: string | null
  description: string | null
  keywords: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  risk_threshold: number
  visual_markers: Array<{ text: string; weight: number }>
  negative_markers: Array<{ text: string; weight: number }>
  color: string
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Низкая', color: '#4caf50' },
  { value: 'medium', label: 'Средняя', color: '#ff9800' },
  { value: 'high', label: 'Высокая', color: '#f44336' },
  { value: 'critical', label: 'Критическая', color: '#d50000' },
]

const SEVERITY_COLORS: Record<string, string> = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  critical: '#d50000',
}

// Парсинг ключевых слов из строки в массив
const parseKeywords = (keywords: string | null): string[] => {
  if (!keywords) return []
  return keywords
}

// Безопасное получение маркеров
const safeMarkers = (markers: any): Array<{ text: string; weight: number }> => {
  if (!Array.isArray(markers)) return []
  return markers.filter(m => m && m.text)
}

const DirectionsManagement = () => {
  const { user } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [directions, setDirections] = useState<Direction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Диалоги
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDirection, setEditingDirection] = useState<Direction | null>(null)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  
  // Форма (без code)
  const [formName, setFormName] = useState('')
  const [formNameKk, setFormNameKk] = useState('')
  const [formNameEn, setFormNameEn] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formKeywords, setFormKeywords] = useState<string[]>([])
  const [formSeverity, setFormSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [formRiskThreshold, setFormRiskThreshold] = useState(6.0)
  const [formVisualMarkers, setFormVisualMarkers] = useState<Array<{ text: string; weight: number }>>([])
  const [formNegativeMarkers, setFormNegativeMarkers] = useState<Array<{ text: string; weight: number }>>([])
  const [formColor, setFormColor] = useState('#6c757d')
  const [formIcon, setFormIcon] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  
  // UI
  const [newKeyword, setNewKeyword] = useState('')
  const [newMarkerText, setNewMarkerText] = useState('')
  const [newMarkerWeight, setNewMarkerWeight] = useState(1.0)
  const [markerType, setMarkerType] = useState<'visual' | 'negative'>('visual')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateName, setGenerateName] = useState('')
  const [generateDescription, setGenerateDescription] = useState('')

  const isAdmin = user?.role === 'ADMIN'

  // ============ ЗАПРОСЫ К СЕРВЕРУ ============
  
  const fetchDirections = async () => {
    setLoading(true)
    try {
      const res = await $host.get('/directions')
      setDirections(res.data.data || [])
    } catch (err: any) {
      setError('Ошибка загрузки')
      toast.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchDirections()
    }
  }, [isAdmin])

  // ============ РАБОТА С ФОРМОЙ ============
  
  const resetForm = () => {
    setFormName('')
    setFormNameKk('')
    setFormNameEn('')
    setFormDescription('')
    setFormKeywords([])
    setFormSeverity('medium')
    setFormRiskThreshold(6.0)
    setFormVisualMarkers([])
    setFormNegativeMarkers([])
    setFormColor('#6c757d')
    setFormIcon('')
    setFormIsActive(true)
    setNewKeyword('')
    setNewMarkerText('')
    setNewMarkerWeight(1.0)
  }

  const openCreateDialog = () => {
    setEditingDirection(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (dir: Direction) => {
    setEditingDirection(dir)
    setFormName(dir.name)
    setFormNameKk(dir.name_kk || '')
    setFormNameEn(dir.name_en || '')
    setFormDescription(dir.description || '')
    setFormKeywords(parseKeywords(dir.keywords))
    setFormSeverity(dir.severity)
    setFormRiskThreshold(dir.risk_threshold)
    setFormVisualMarkers(safeMarkers(dir.visual_markers))
    setFormNegativeMarkers(safeMarkers(dir.negative_markers))
    setFormColor(dir.color)
    setFormIcon(dir.icon || '')
    setFormIsActive(dir.is_active)
    setDialogOpen(true)
  }

  // ============ КЛЮЧЕВЫЕ СЛОВА ============
  
  const handleAddKeyword = () => {
    const kw = newKeyword.trim()
    if (!kw) return
    if (formKeywords.includes(kw)) {
      toast.warning('Уже добавлено')
      return
    }
    setFormKeywords([...formKeywords, kw])
    setNewKeyword('')
  }

  const handleRemoveKeyword = (kw: string) => {
    setFormKeywords(formKeywords.filter((k) => k !== kw))
  }

  // ============ МАРКЕРЫ ============
  
  const handleAddMarker = () => {
    const text = newMarkerText.trim()
    if (!text) return
    
    const marker = { text, weight: newMarkerWeight }
    
    if (markerType === 'visual') {
      if (formVisualMarkers.some(m => m.text === text)) {
        toast.warning('Уже добавлено')
        return
      }
      setFormVisualMarkers([...formVisualMarkers, marker])
    } else {
      if (formNegativeMarkers.some(m => m.text === text)) {
        toast.warning('Уже добавлено')
        return
      }
      setFormNegativeMarkers([...formNegativeMarkers, marker])
    }
    
    setNewMarkerText('')
    setNewMarkerWeight(1.0)
  }

  const handleRemoveMarker = (type: 'visual' | 'negative', text: string) => {
    if (type === 'visual') {
      setFormVisualMarkers(formVisualMarkers.filter(m => m.text !== text))
    } else {
      setFormNegativeMarkers(formNegativeMarkers.filter(m => m.text !== text))
    }
  }

  // ============ СОХРАНЕНИЕ ============
  
  const handleSave = async () => {
    if (!formName.trim()) {
      toast.warning('Заполните название')
      return
    }
    
    setSaving(true)
    try {
      const payload = {
        name: formName.trim(),
        name_kk: formNameKk.trim() || null,
        name_en: formNameEn.trim() || null,
        description: formDescription.trim() || null,
        keywords: formKeywords.length > 0 ? formKeywords.join(', ') : null,
        severity: formSeverity,
        risk_threshold: formRiskThreshold,
        visual_markers: formVisualMarkers,
        negative_markers: formNegativeMarkers,
        color: formColor,
        icon: formIcon.trim() || null,
        is_active: formIsActive,
      }
      
      if (editingDirection) {
        await $host.put(`/directions/${editingDirection.id}`, payload)
        toast.success('Обновлено')
      } else {
        await $host.post('/directions', payload)
        toast.success('Создано')
      }
      
      setDialogOpen(false)
      fetchDirections()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить?')) return
    try {
      await $host.delete(`/directions/${id}`)
      toast.success('Удалено')
      fetchDirections()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка')
    }
  }

  // ============ ГЕНЕРАЦИЯ ============
  
  const handleGenerate = async () => {
    if (!generateName.trim()) {
      toast.warning('Введите название')
      return
    }
    
    setGenerating(true)
    try {
      const res = await $host.post('/directions/generate', {
        name: generateName.trim(),
        description: generateDescription.trim() || '',
      })
      
      const data = res.data.data
      
      // Заполняем форму (без code)
      setFormName(data.name)
      setFormNameKk(data.name_kk || '')
      setFormNameEn(data.name_en || '')
      setFormDescription(data.description || '')
      setFormSeverity(data.severity)
      setFormRiskThreshold(data.risk_threshold)
      setFormVisualMarkers(safeMarkers(data.visual_markers))
      setFormNegativeMarkers(safeMarkers(data.negative_markers))
      setFormColor(data.color)
      setFormIcon(data.icon || '')
      setFormKeywords(parseKeywords(data.keywords))
      
      toast.success('Сгенерировано!')
      setGenerateDialogOpen(false)
      setDialogOpen(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка генерации')
    } finally {
      setGenerating(false)
    }
  }

  // ============ ВСПОМОГАТЕЛЬНЫЕ ============
  
  const getSeverityColor = (severity: string) => {
    return SEVERITY_COLORS[severity] || '#6c757d'
  }

  const getSeverityLabel = (severity: string) => {
    const found = SEVERITY_OPTIONS.find(s => s.value === severity)
    return found?.label || severity
  }

  // ============ RENDER ============
  
  if (!isAdmin) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', bgcolor: '#03030f' }}>
        <Typography variant="h5">Доступ запрещён</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#03030f', color: '#fff' }}>
      {/* Хедер */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#0ff' }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h5" sx={{ ml: 2, color: '#0ff' }}>
          Направления
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => setGenerateDialogOpen(true)}
          sx={{ mr: 1, bgcolor: '#aa66ff' }}
        >
          Сгенерировать
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          sx={{ bgcolor: '#0ff', color: '#000' }}
        >
          Создать
        </Button>
      </Box>

      <CyberSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Box sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#0ff' }} />
            </Box>
          ) : directions.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: '#888' }}>
              Нет направлений
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#0ff' }}>ID</TableCell>
                    <TableCell sx={{ color: '#0ff' }}>Название</TableCell>
                    <TableCell sx={{ color: '#0ff' }}>Серьёзность</TableCell>
                    <TableCell sx={{ color: '#0ff' }}>Порог</TableCell>
                    <TableCell sx={{ color: '#0ff' }}>Маркеры</TableCell>
                    <TableCell sx={{ color: '#0ff' }}>Статус</TableCell>
                    <TableCell sx={{ color: '#0ff' }} align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {directions.map((dir) => (
                    <TableRow key={dir.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                      <TableCell sx={{ color: '#fff' }}>#{dir.id}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        <Box>
                          <Typography variant="body2">{dir.name}</Typography>
                          {dir.name_kk && (
                            <Typography variant="caption" sx={{ color: '#888' }}>
                              {dir.name_kk}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getSeverityLabel(dir.severity)}
                          size="small"
                          sx={{
                            bgcolor: getSeverityColor(dir.severity) + '33',
                            color: getSeverityColor(dir.severity),
                            border: `1px solid ${getSeverityColor(dir.severity)}`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>{dir.risk_threshold}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {safeMarkers(dir.visual_markers).slice(0, 3).map((m) => (
                            <Chip
                              key={m.text}
                              label={m.text}
                              size="small"
                              sx={{ bgcolor: 'rgba(0,255,255,0.1)', color: '#0ff' }}
                            />
                          ))}
                          {safeMarkers(dir.visual_markers).length > 3 && (
                            <Chip label={`+${safeMarkers(dir.visual_markers).length - 3}`} size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={dir.is_active ? 'Активен' : 'Неактивен'}
                          size="small"
                          sx={{
                            bgcolor: dir.is_active ? 'rgba(0,255,0,0.15)' : 'rgba(255,0,0,0.15)',
                            color: dir.is_active ? '#4caf50' : '#f44336',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => openEditDialog(dir)} sx={{ color: '#0ff' }}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(dir.id)} sx={{ color: '#ff3366' }}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Box>

      {/* ============ ДИАЛОГ СОЗДАНИЯ/РЕДАКТИРОВАНИЯ ============ */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(10,10,30,0.95)',
            border: '1px solid rgba(0,255,255,0.3)',
            borderRadius: 2,
            color: '#fff',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(0,255,255,0.2)', display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ color: '#0ff' }}>
            {editingDirection ? 'Редактировать' : 'Новое направление'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ color: '#0ff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Название *"
                fullWidth
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    bgcolor: 'rgba(0,0,0,0.4)', 
                    '& fieldset': { borderColor: '#0ff' } 
                  }, 
                  input: { color: '#fff' }, 
                  label: { color: '#aaa' } 
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Название (каз)"
                fullWidth
                value={formNameKk}
                onChange={(e) => setFormNameKk(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    bgcolor: 'rgba(0,0,0,0.4)', 
                    '& fieldset': { borderColor: '#0ff' } 
                  }, 
                  input: { color: '#fff' }, 
                  label: { color: '#aaa' } 
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Название (англ)"
                fullWidth
                value={formNameEn}
                onChange={(e) => setFormNameEn(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    bgcolor: 'rgba(0,0,0,0.4)', 
                    '& fieldset': { borderColor: '#0ff' } 
                  }, 
                  input: { color: '#fff' }, 
                  label: { color: '#aaa' } 
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Описание"
                fullWidth
                multiline
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    bgcolor: 'rgba(0,0,0,0.4)', 
                    '& fieldset': { borderColor: '#0ff' } 
                  }, 
                  textarea: { color: '#fff' }, 
                  label: { color: '#aaa' } 
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#aaa' }}>Серьёзность</InputLabel>
                <Select
                  value={formSeverity}
                  onChange={(e) => setFormSeverity(e.target.value as any)}
                  sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.4)' }}
                >
                  {SEVERITY_OPTIONS.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: s.color }} />
                        {s.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Typography sx={{ color: '#aaa', fontSize: '0.8rem' }}>Порог: {formRiskThreshold}</Typography>
                <Slider
                  value={formRiskThreshold}
                  onChange={(_, val) => setFormRiskThreshold(val as number)}
                  min={0}
                  max={10}
                  step={0.5}
                  sx={{ color: getSeverityColor(formSeverity) }}
                />
              </Box>
            </Grid>

            {/* Ключевые слова */}
            <Grid item xs={12}>
              <Typography sx={{ color: '#fff', mb: 1 }}>Ключевые слова</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  placeholder="Введите..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  sx={{ 
                    flex: 1, 
                    '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.4)' }, 
                    input: { color: '#fff' } 
                  }}
                />
                <Button variant="contained" onClick={handleAddKeyword} sx={{ bgcolor: '#0ff', color: '#000' }}>
                  <AddIcon />
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {formKeywords.map((kw) => (
                  <Chip
                    key={kw}
                    label={kw}
                    onDelete={() => handleRemoveKeyword(kw)}
                    sx={{ bgcolor: 'rgba(0,255,255,0.15)', color: '#0ff', border: '1px solid #0ff' }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            </Grid>

            {/* Маркеры */}
            <Grid item xs={12}>
              <Typography sx={{ color: '#fff', mb: 1 }}>Маркеры</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Текст..."
                  value={newMarkerText}
                  onChange={(e) => setNewMarkerText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMarker()}
                  sx={{ 
                    flex: 2, 
                    minWidth: 150, 
                    '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.4)' }, 
                    input: { color: '#fff' } 
                  }}
                />
                <TextField
                  type="number"
                  label="Вес"
                  value={newMarkerWeight}
                  onChange={(e) => setNewMarkerWeight(Number(e.target.value))}
                  inputProps={{ min: 0.5, max: 3, step: 0.1 }}
                  sx={{ 
                    width: 100, 
                    '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.4)' }, 
                    input: { color: '#fff' }, 
                    label: { color: '#aaa' } 
                  }}
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ color: '#aaa' }}>Тип</InputLabel>
                  <Select
                    value={markerType}
                    onChange={(e) => setMarkerType(e.target.value as any)}
                    sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.4)' }}
                  >
                    <MenuItem value="visual">Визуальный</MenuItem>
                    <MenuItem value="negative">Негативный</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={handleAddMarker} sx={{ bgcolor: '#ffaa44', color: '#000' }}>
                  <AddIcon />
                </Button>
              </Box>
              
              {formVisualMarkers.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography sx={{ color: '#0ff', fontSize: '0.8rem' }}>Визуальные ({formVisualMarkers.length}):</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {formVisualMarkers.map((m) => (
                      <Chip
                        key={m.text}
                        label={`${m.text} (${m.weight})`}
                        onDelete={() => handleRemoveMarker('visual', m.text)}
                        sx={{ bgcolor: 'rgba(0,255,255,0.15)', color: '#0ff', border: '1px solid #0ff' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              {formNegativeMarkers.length > 0 && (
                <Box>
                  <Typography sx={{ color: '#ffaa44', fontSize: '0.8rem' }}>Негативные ({formNegativeMarkers.length}):</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {formNegativeMarkers.map((m) => (
                      <Chip
                        key={m.text}
                        label={`${m.text} (${m.weight})`}
                        onDelete={() => handleRemoveMarker('negative', m.text)}
                        sx={{ bgcolor: 'rgba(255,170,68,0.15)', color: '#ffaa44', border: '1px solid #ffaa44' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            </Grid>

            {/* Цвет и иконка */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Цвет (HEX)"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  sx={{ 
                    flex: 1, 
                    '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.4)' }, 
                    input: { color: '#fff' }, 
                    label: { color: '#aaa' } 
                  }}
                />
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: formColor, border: '1px solid rgba(255,255,255,0.2)' }} />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Иконка"
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                placeholder="fa-casino"
                sx={{ 
                  '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.4)' }, 
                  input: { color: '#fff' }, 
                  label: { color: '#aaa' } 
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={formIsActive} 
                    onChange={(e) => setFormIsActive(e.target.checked)} 
                    sx={{ '& .MuiSwitch-thumb': { bgcolor: '#0ff' } }} 
                  />
                }
                label={formIsActive ? 'Активно' : 'Неактивно'}
                sx={{ color: '#fff' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(0,255,255,0.2)', p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#aaa' }}>Отмена</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ bgcolor: '#0ff', color: '#000' }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============ ДИАЛОГ ГЕНЕРАЦИИ ============ */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(10,10,30,0.95)',
            border: '1px solid rgba(170,102,255,0.3)',
            borderRadius: 2,
            color: '#fff',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(170,102,255,0.2)', display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ color: '#aa66ff' }}>
            <AutoAwesomeIcon sx={{ mr: 1 }} />
            Генерация через AI
          </Typography>
          <IconButton onClick={() => setGenerateDialogOpen(false)} sx={{ color: '#aa66ff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography sx={{ color: '#aaa', mb: 2 }}>
            Введите название, AI сгенерирует структуру с маркерами
          </Typography>
          <TextField
            label="Название *"
            fullWidth
            value={generateName}
            onChange={(e) => setGenerateName(e.target.value)}
            sx={{ 
              mb: 2, 
              '& .MuiOutlinedInput-root': { 
                bgcolor: 'rgba(0,0,0,0.4)', 
                '& fieldset': { borderColor: '#aa66ff' } 
              }, 
              input: { color: '#fff' }, 
              label: { color: '#aaa' } 
            }}
          />
          <TextField
            label="Описание"
            fullWidth
            multiline
            rows={3}
            value={generateDescription}
            onChange={(e) => setGenerateDescription(e.target.value)}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                bgcolor: 'rgba(0,0,0,0.4)', 
                '& fieldset': { borderColor: '#aa66ff' } 
              }, 
              textarea: { color: '#fff' }, 
              label: { color: '#aaa' } 
            }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(170,102,255,0.2)', p: 2 }}>
          <Button onClick={() => setGenerateDialogOpen(false)} sx={{ color: '#aaa' }}>Отмена</Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || !generateName.trim()}
            variant="contained"
            startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
            sx={{ bgcolor: '#aa66ff', color: '#fff' }}
          >
            {generating ? 'Генерация...' : 'Сгенерировать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DirectionsManagement