import React, { useState, useEffect } from 'react'
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
  Grid,
  Paper,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SaveIcon from '@mui/icons-material/Save'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import SettingsIcon from '@mui/icons-material/Settings'
import NewsIcon from '@mui/icons-material/Feed'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import WarningIcon from '@mui/icons-material/Warning'
import { motion } from 'framer-motion'
import CyberSidebar from '../components/CyberSidebar'
import { useTranslation } from 'react-i18next'
import { useUser } from '../context/user/useUser'
import { $host } from '../http/API'
import { toast } from 'react-toastify'

interface Settings {
  scanInterval: number
  autoRefreshNews: boolean
  newsParseInterval: number
  newsSources: string[]
  videoScrapeInterval: number
  scrapeLimitPerPlatform: number
  scrapeTimeoutSeconds: number
  enableYouTube: boolean
  enableTikTok: boolean
  enableInstagram: boolean
  scrapingEnabled: boolean
}

interface ScrapeStatus {
  scrapingEnabled: boolean
  lastRun: string | null
  addedCount: number
  totalFound: number
  error: string | null
  queueCount: number
  totalAnalyzed: number
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

const AdminSettings = () => {
  const { t, ready } = useTranslation()
  const { user } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    scanInterval: 5,
    autoRefreshNews: true,
    newsParseInterval: 60,
    newsSources: [],
    videoScrapeInterval: 60,
    scrapeLimitPerPlatform: 5,
    scrapeTimeoutSeconds: 30,
    enableYouTube: true,
    enableTikTok: true,
    enableInstagram: true,
    scrapingEnabled: false,
  })
  const [status, setStatus] = useState<ScrapeStatus>({
    scrapingEnabled: false,
    lastRun: null,
    addedCount: 0,
    totalFound: 0,
    error: null,
    queueCount: 0,
    totalAnalyzed: 0,
  })
  const [newSource, setNewSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [scrapingManually, setScrapingManually] = useState(false)
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
        videoScrapeInterval: res.data.videoScrapeInterval || 60,
        scrapeLimitPerPlatform: res.data.scrapeLimitPerPlatform || 5,
        scrapeTimeoutSeconds: res.data.scrapeTimeoutSeconds || 30,
        enableYouTube:
          res.data.enableYouTube !== undefined ? res.data.enableYouTube : true,
        enableTikTok:
          res.data.enableTikTok !== undefined ? res.data.enableTikTok : true,
        enableInstagram:
          res.data.enableInstagram !== undefined
            ? res.data.enableInstagram
            : true,
        scrapingEnabled:
          res.data.scrapingEnabled !== undefined
            ? res.data.scrapingEnabled
            : false,
      })
      await fetchStatus()
    } catch (err: any) {
      console.error('Ошибка загрузки настроек:', err)
      setError(t('ne-udalos--3'))
      toast.error(t('oshibka-za-1'))
    } finally {
      setLoading(false)
    }
  }

  const fetchStatus = async () => {
    setStatusLoading(true)
    try {
      const res = await $host.get('/settings/status')
      setStatus(res.data)
    } catch (err) {
      // ignore
    } finally {
      setStatusLoading(false)
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
      toast.success(t('nastroiki-'))
      await fetchStatus()
    } catch (err: any) {
      console.error('Ошибка сохранения:', err)
      setError(t('ne-udalos--4'))
      toast.error(t('oshibka-so'))
    } finally {
      setSaving(false)
    }
  }

  const handleAddSource = () => {
    const url = newSource.trim()
    if (!url) return
    if (settings.newsSources.includes(url)) {
      toast.warning(t('takoi-isto'))
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

  const handleToggleScraping = async () => {
    setToggling(true)
    try {
      const res = await $host.post('/settings/toggle-scraping')
      setSettings((prev) => ({
        ...prev,
        scrapingEnabled: res.data.scrapingEnabled,
      }))
      toast.success(res.data.message)
      await fetchStatus()
    } catch (err: any) {
      console.error('Ошибка переключения парсинга:', err)
      toast.error(err.response?.data?.error || t('oshibka-pe'))
    } finally {
      setToggling(false)
    }
  }

  const handleManualScrape = async () => {
    setScrapingManually(true)
    try {
      const res = await $host.post('/settings/scrape-video')
      toast.success(res.data.message || t('sbor-video'))
      await fetchStatus()
    } catch (err: any) {
      console.error('Ошибка ручного запуска:', err)
      toast.error(err.response?.data?.error || t('oshibka-za-2'))
    } finally {
      setScrapingManually(false)
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
        <Typography variant="h5">{t('dostup-zap-0')}</Typography>
      </Box>
    )
  }

  if (!ready) return null

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#03030f',
        }}
      >
        <CircularProgress sx={{ color: '#0ff' }} />
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
            <SettingsIcon sx={{ mr: 1 }} /> {t('nastroiki--0')}
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
          <Typography
            variant="h5"
            sx={{
              color: '#33ffcc',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CloudDownloadIcon /> {t('upravlenie-1')}
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}
              >
                <Button
                  variant="contained"
                  onClick={handleToggleScraping}
                  disabled={toggling}
                  startIcon={
                    toggling ? (
                      <CircularProgress size={20} sx={{ color: '#000' }} />
                    ) : settings.scrapingEnabled ? (
                      <StopIcon />
                    ) : (
                      <PlayArrowIcon />
                    )
                  }
                  sx={{
                    bgcolor: settings.scrapingEnabled ? '#ff3366' : '#33ffcc',
                    color: '#000',
                    '&:hover': {
                      bgcolor: settings.scrapingEnabled ? '#ff0000' : '#00e676',
                    },
                  }}
                >
                  {settings.scrapingEnabled ? t('ostanovit-') : t('zapustit-p')}
                </Button>
                <Typography sx={{ color: '#aaa' }}>
                  {settings.scrapingEnabled ? t('aktiven') : t('ostanovlen')}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography sx={{ color: '#fff', mb: 1 }}>
                  {t('interval-m')} {settings.videoScrapeInterval} {t('minut')}
                </Typography>
                <Slider
                  value={settings.videoScrapeInterval}
                  onChange={(_, val) =>
                    setSettings((prev) => ({
                      ...prev,
                      videoScrapeInterval: val as number,
                    }))
                  }
                  min={10}
                  max={1440}
                  step={5}
                  sx={{
                    color: '#0ff',
                    '& .MuiSlider-track': { color: '#0ff' },
                    '& .MuiSlider-thumb': { color: '#0ff' },
                  }}
                />
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  {t('kak-chasto')}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography sx={{ color: '#fff', mb: 1 }}>
                  {t('kolichestv-0')} {settings.scrapeLimitPerPlatform}
                </Typography>
                <Slider
                  value={settings.scrapeLimitPerPlatform}
                  onChange={(_, val) =>
                    setSettings((prev) => ({
                      ...prev,
                      scrapeLimitPerPlatform: val as number,
                    }))
                  }
                  min={1}
                  max={20}
                  step={1}
                  sx={{
                    color: '#0ff',
                    '& .MuiSlider-track': { color: '#0ff' },
                    '& .MuiSlider-thumb': { color: '#0ff' },
                  }}
                />
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  {t('skolko-vid')}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography sx={{ color: '#fff', mb: 1 }}>
                  {t('taimaut-me')} {settings.scrapeTimeoutSeconds}{' '}
                  {t('sekund')}
                </Typography>
                <Slider
                  value={settings.scrapeTimeoutSeconds}
                  onChange={(_, val) =>
                    setSettings((prev) => ({
                      ...prev,
                      scrapeTimeoutSeconds: val as number,
                    }))
                  }
                  min={5}
                  max={120}
                  step={5}
                  sx={{
                    color: '#0ff',
                    '& .MuiSlider-track': { color: '#0ff' },
                    '& .MuiSlider-thumb': { color: '#0ff' },
                  }}
                />
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  {t('zaderzhka-')}
                </Typography>
              </Box>

              <Typography sx={{ color: '#fff', mb: 1 }}>
                {t('aktivnye-p')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableYouTube}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          enableYouTube: e.target.checked,
                        }))
                      }
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#ff0000',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                          { bgcolor: '#ff0000' },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: '#fff' }}>YouTube</Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableTikTok}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          enableTikTok: e.target.checked,
                        }))
                      }
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#00f2ea',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                          { bgcolor: '#00f2ea' },
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#fff' }}>TikTok</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableInstagram}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          enableInstagram: e.target.checked,
                        }))
                      }
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#e4405f',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                          { bgcolor: '#e4405f' },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: '#fff' }}>Instagram</Typography>
                  }
                />
              </Box>

              <Button
                variant="outlined"
                startIcon={
                  scrapingManually ? (
                    <CircularProgress size={20} sx={{ color: '#0ff' }} />
                  ) : (
                    <RefreshIcon />
                  )
                }
                onClick={handleManualScrape}
                disabled={scrapingManually}
                sx={{ mt: 2, borderColor: '#0ff', color: '#0ff' }}
              >
                {scrapingManually ? t('sbor') : t('zapustit-s')}
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  bgcolor: 'rgba(0,0,0,0.4)',
                  borderRadius: 2,
                  p: 2,
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ color: '#0ff' }}>
                    {t('status-par')}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={fetchStatus}
                    disabled={statusLoading}
                    sx={{ color: '#0ff' }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Paper
                      sx={{
                        bgcolor: 'rgba(0,0,0,0.5)',
                        p: 1.5,
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          color: status.scrapingEnabled ? '#33ffcc' : '#ff6666',
                          fontWeight: 'bold',
                          fontSize: '1.2rem',
                        }}
                      >
                        {status.scrapingEnabled
                          ? t('aktiven')
                          : t('ostanovlen')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>
                        {t('status')}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper
                      sx={{
                        bgcolor: 'rgba(0,0,0,0.5)',
                        p: 1.5,
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          color: '#ffaa44',
                          fontWeight: 'bold',
                          fontSize: '1.2rem',
                        }}
                      >
                        {status.queueCount}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>
                        {t('v-ocheredi')}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper
                      sx={{
                        bgcolor: 'rgba(0,0,0,0.5)',
                        p: 1.5,
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          color: '#33ffcc',
                          fontWeight: 'bold',
                          fontSize: '1.2rem',
                        }}
                      >
                        {status.totalAnalyzed}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>
                        {t('obrabotano')}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper
                      sx={{
                        bgcolor: 'rgba(0,0,0,0.5)',
                        p: 1.5,
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          color: '#0ff',
                          fontWeight: 'bold',
                          fontSize: '1.2rem',
                        }}
                      >
                        {status.lastRun
                          ? new Date(status.lastRun).toLocaleTimeString()
                          : '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>
                        {t('poslednii-')}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {status.error && (
                  <Alert
                    severity="error"
                    sx={{
                      mt: 2,
                      bgcolor: 'rgba(255,51,102,0.2)',
                      color: '#ff8888',
                    }}
                  >
                    <WarningIcon sx={{ mr: 1, fontSize: 18 }} />
                    {status.error}
                  </Alert>
                )}

                {status.addedCount > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 2, color: '#aaa' }}
                  >
                    {t('poslednii--0')} {status.addedCount} {t('iz')}{' '}
                    {status.totalFound} {t('naidennykh')}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Card>

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
          <Typography
            variant="h5"
            sx={{
              color: '#ffaa44',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <AnalyticsIcon /> {t('upravlenie-2')}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: '#fff', mb: 1 }}>
              {t('interval-a')} {settings.scanInterval} {t('minut')}
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
                '& .MuiSlider-thumb': { color: '#0ff' },
              }}
            />
            <Typography variant="caption" sx={{ color: '#aaa' }}>
              {t('kak-chasto-0')}
            </Typography>
          </Box>
        </Card>

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
          <Typography
            variant="h5"
            sx={{
              color: '#33ffcc',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <NewsIcon /> {t('upravlenie-3')}
          </Typography>

          <Box sx={{ mb: 2 }}>
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
              label={
                settings.autoRefreshNews ? t('avtoobnovl') : t('avtoobnovl-0')
              }
              sx={{ color: '#fff' }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: '#fff', mb: 1 }}>
              {t('interval-p')} {settings.newsParseInterval} {t('minut')}
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
                '& .MuiSlider-thumb': { color: '#0ff' },
              }}
            />
            <Typography variant="caption" sx={{ color: '#aaa' }}>
              {t('kak-chasto-1')}
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography sx={{ color: '#fff', mb: 1 }}>
              {t('istochniki')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                placeholder={t('vvedite-ur')}
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
                  {t('net-dobavl')}
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
          </Box>
        </Card>

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
          {saving ? t('sokhraneni') : t('sokhranit-')}
        </Button>
      </Box>
    </Box>
  )
}

export default AdminSettings
