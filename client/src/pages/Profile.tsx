import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  Avatar,
  IconButton,
  Button,
  Grid,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Link,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import HelpIcon from '@mui/icons-material/Help'
import HistoryIcon from '@mui/icons-material/History'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import SecurityIcon from '@mui/icons-material/Security'
import PersonIcon from '@mui/icons-material/Person'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { useTranslation } from 'react-i18next'
import { useUser } from '../context/user/useUser'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'
import CyberSidebar from '../components/CyberSidebar'
import { $host, VideoAnalysis } from '../http/API'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const Planet = ({ radius, color, position, speed, emissive = false }) => {
  const meshRef = React.useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current && speed) {
      meshRef.current.rotation.y = clock.getElapsedTime() * speed
    }
  })
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={0.1}
        emissive={emissive ? color : '#000000'}
        emissiveIntensity={emissive ? 0.3 : 0}
      />
    </mesh>
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
        backgroundColor: '#030318',
      }}
    >
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-5, -5, 5]} color="#ff3366" intensity={0.2} />

        <Planet
          radius={2.2}
          color="#4a6eff"
          position={[-5, 1, -8]}
          speed={0.1}
          emissive
        />
        <Planet
          radius={1.8}
          color="#ff8844"
          position={[6, -2, -12]}
          speed={0.08}
        />
        <Planet
          radius={1.5}
          color="#66ffaa"
          position={[3, 3, -15]}
          speed={0.05}
          emissive
        />
        <Planet
          radius={2.5}
          color="#aa55ff"
          position={[-4, -2.5, -20]}
          speed={0.03}
        />
        <Planet
          radius={1.2}
          color="#ff6699"
          position={[0, 4, -25]}
          speed={0.02}
        />

        <Stars
          radius={100}
          depth={80}
          count={3000}
          factor={5}
          saturation={0}
          fade
          speed={0.1}
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

interface UserStats {
  totalChecks: number
  threatsFound: number
  averageRisk: number
}

interface ActivityData {
  date: string
  count: number
}

interface VerdictDistribution {
  safe: number
  dangerous: number
  uncertain: number
}

const Profile = () => {
  const { user, login } = useUser()
  const { t, ready } = useTranslation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [stats, setStats] = useState<UserStats>({
    totalChecks: 0,
    threatsFound: 0,
    averageRisk: 0,
  })

  const [activity, setActivity] = useState<ActivityData[]>([])
  const [verdictDist, setVerdictDist] = useState<VerdictDistribution>({
    safe: 0,
    dangerous: 0,
    uncertain: 0,
  })
  const [recentChecks, setRecentChecks] = useState<VideoAnalysis[]>([])

  const [loading, setLoading] = useState(true)
  const [avatarPreview, setAvatarPreview] = useState('')

  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [avatarUrlInput, setAvatarUrlInput] = useState('')
  const [avatarSaving, setAvatarSaving] = useState(false)

  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'info',
  })

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    setAvatarPreview(user.photoURL || '')
    fetchProfileData()
  }, [user])

  const fetchProfileData = async () => {
    setLoading(true)
    try {
      const [statsRes, activityRes, verdictRes, recentRes] = await Promise.all([
        $host.get('/user/stats'),
        $host.get('/user/activity?days=7'),
        $host.get('/user/verdict-distribution'),
        $host.get('/user/recent-checks?limit=5'),
      ])
      setStats(statsRes.data)
      setActivity(activityRes.data.data || [])
      setVerdictDist(verdictRes.data)
      setRecentChecks(recentRes.data)
    } catch (error) {
      console.error(t('oshibka-za'), error)
      setSnackbar({
        open: true,
        message: t('ne-udalos-'),
        severity: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAvatarUrl = async () => {
    let trimmed = avatarUrlInput.trim()
    if (!trimmed) {
      setSnackbar({ open: true, message: t('vvedite-ss'), severity: 'error' })
      return
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed
    }
    setAvatarSaving(true)
    try {
      const res = await $host.post('/user/avatar', { avatarUrl: trimmed })
      if (user) {
        const updatedUser = { ...user, photoURL: res.data.avatarUrl }
        login(updatedUser, localStorage.token)
        setAvatarPreview(res.data.avatarUrl)
      }
      setSnackbar({
        open: true,
        message: t('avatar-obn'),
        severity: 'success',
      })
      setAvatarDialogOpen(false)
      setAvatarUrlInput('')
    } catch (error) {
      console.error(error)
      setSnackbar({
        open: true,
        message: t('oshibka-ob'),
        severity: 'error',
      })
    } finally {
      setAvatarSaving(false)
    }
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
        <CircularProgress sx={{ color: '#0ff' }} />
      </Box>
    )
  }

  if (!ready) return null

  const verdictColors = {
    safe: '#44ff66',
    dangerous: '#ff3366',
    uncertain: '#ffaa44',
  }

  const verdictLabels = {
    safe: 'Безопасно',
    dangerous: 'Опасно',
    uncertain: 'Неопределённо',
  }

  return (
    <>
      <SpaceBackground />
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
                mb: 4,
                background: 'linear-gradient(135deg, #ff3366, #33ffcc)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {t('profil-pol')}
            </Typography>
          </motion.div>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card
                  sx={{
                    bgcolor: 'rgba(10,10,30,0.6)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 4,
                    border: '1px solid rgba(0,255,255,0.3)',
                    p: 3,
                    textAlign: 'center',
                  }}
                >
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      src={avatarPreview || user.photoURL || undefined}
                      sx={{
                        width: 120,
                        height: 120,
                        border: '3px solid #0ff',
                        boxShadow: '0 0 20px #0ff',
                        mx: 'auto',
                      }}
                    >
                      {!avatarPreview && !user.photoURL && (
                        <PersonIcon sx={{ fontSize: 60, color: '#aaa' }} />
                      )}
                    </Avatar>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: '#0ff',
                        color: '#000',
                        '&:hover': { bgcolor: '#33ffcc' },
                      }}
                      onClick={() => setAvatarDialogOpen(true)}
                    >
                      <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="h6" sx={{ mt: 2, color: '#fff' }}>
                    {user.first_name || user.email?.split('@')[0]}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#88f' }}>
                    {user.email}
                  </Typography>
                  <Chip
                    icon={
                      user.role === 'ADMIN' ? (
                        <AdminPanelSettingsIcon />
                      ) : (
                        <PersonIcon />
                      )
                    }
                    label={
                      user.role === 'ADMIN' ? t('administra') : t('polzovatel')
                    }
                    size="small"
                    sx={{ mt: 2, bgcolor: '#ff3366', color: '#fff' }}
                  />
                </Card>
              </motion.div>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card
                  sx={{
                    bgcolor: 'rgba(10,10,30,0.6)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 4,
                    border: '1px solid rgba(0,255,255,0.3)',
                    p: 3,
                    mb: 4,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#0ff',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <HistoryIcon /> {t('vasha-akti')}
                  </Typography>
                  {loading ? (
                    <CircularProgress sx={{ color: '#0ff' }} />
                  ) : (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, md: 4 }}>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                          {t('vsego-prov')}
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ color: '#33ffcc', fontWeight: 'bold' }}
                        >
                          {stats.totalChecks}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 4 }}>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                          {t('naideno-ug')}
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ color: '#ff6666', fontWeight: 'bold' }}
                        >
                          {stats.threatsFound}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 4 }}>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                          {t('srednii-ri')}
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ color: '#ffaa44', fontWeight: 'bold' }}
                        >
                          {stats.averageRisk}%
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card
                  sx={{
                    bgcolor: 'rgba(10,10,30,0.6)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 4,
                    border: '1px solid rgba(0,255,255,0.3)',
                    p: 3,
                    mb: 4,
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#0ff', mb: 2 }}>
                    <TrendingUpIcon sx={{ mr: 1 }} /> {t('aktivnost-')}
                  </Typography>
                  {loading ? (
                    <CircularProgress sx={{ color: '#0ff' }} />
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={activity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#ccc" />
                        <YAxis stroke="#ccc" allowDecimals={false} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: '#111',
                            borderColor: '#0ff',
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#33ffcc"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </motion.div>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card
                      sx={{
                        bgcolor: 'rgba(10,10,30,0.6)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: 4,
                        border: '1px solid rgba(0,255,255,0.3)',
                        p: 3,
                        height: '100%',
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#0ff', mb: 2 }}>
                        <SecurityIcon sx={{ mr: 1 }} /> {t('verdikty')}
                      </Typography>
                      {loading ? (
                        <CircularProgress sx={{ color: '#0ff' }} />
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: t('bezopasno'),
                                  value: verdictDist.safe,
                                },
                                {
                                  name: t('opasno'),
                                  value: verdictDist.dangerous,
                                },
                                {
                                  name: t('neopredely'),
                                  value: verdictDist.uncertain,
                                },
                              ]}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              <Cell fill={verdictColors.safe} />
                              <Cell fill={verdictColors.dangerous} />
                              <Cell fill={verdictColors.uncertain} />
                            </Pie>
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </Card>
                  </motion.div>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Card
                      sx={{
                        bgcolor: 'rgba(10,10,30,0.6)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: 4,
                        border: '1px solid rgba(0,255,255,0.3)',
                        p: 3,
                        height: '100%',
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#0ff', mb: 2 }}>
                        <HistoryIcon sx={{ mr: 1 }} /> {t('poslednie--0')}
                      </Typography>
                      {loading ? (
                        <CircularProgress sx={{ color: '#0ff' }} />
                      ) : recentChecks.length === 0 ? (
                        <Typography sx={{ color: '#aaa' }}>
                          {t('net-prover')}
                        </Typography>
                      ) : (
                        <List dense sx={{ maxHeight: 220, overflow: 'auto' }}>
                          {recentChecks.map((check) => (
                            <div key={check.id}>
                              <ListItem
                                component={Link}
                                href={check.video_url}
                                target="_blank"
                                sx={{ textDecoration: 'none' }}
                              >
                                <ListItemAvatar>
                                  <Avatar
                                    sx={{
                                      bgcolor:
                                        verdictColors[check.verdict_text] ||
                                        '#aaa',
                                    }}
                                  >
                                    {check.verdict_text === 'safe' ? (
                                      <CheckCircleIcon sx={{ color: '#fff' }} />
                                    ) : check.verdict_text === 'dangerous' ? (
                                      <WarningIcon sx={{ color: '#fff' }} />
                                    ) : (
                                      <HelpIcon sx={{ color: '#fff' }} />
                                    )}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={check.title || t('bez-nazvan')}
                                  secondary={`${t('bezopasnos')}: ${check.safety_percent}% • ${new Date(check.checked_at).toLocaleDateString()}`}
                                  primaryTypographyProps={{ color: '#fff' }}
                                  secondaryTypographyProps={{ color: '#aaa' }}
                                />
                              </ListItem>
                              <Divider
                                sx={{ borderColor: 'rgba(0,255,255,0.1)' }}
                              />
                            </div>
                          ))}
                        </List>
                      )}
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Dialog
        open={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#111', color: '#fff', border: '1px solid #0ff' },
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>{t('smenit-ava')}</DialogTitle>
        <DialogContent>
          <TextField
            label=<>{t('ssylka-na-')}</>
            fullWidth
            value={avatarUrlInput}
            onChange={(e) => setAvatarUrlInput(e.target.value)}
            sx={{ mt: 1, input: { color: '#fff' }, label: { color: '#aaa' } }}
            placeholder="example.com/avatar.jpg"
          />
          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 1, color: '#aaa' }}
          >
            {t('mozhno-vve')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAvatarDialogOpen(false)}
            sx={{ color: '#aaa' }}
          >
            {t('otmena')}
          </Button>
          <Button
            onClick={handleSaveAvatarUrl}
            variant="contained"
            disabled={avatarSaving}
            sx={{ bgcolor: '#0ff', color: '#000' }}
          >
            {avatarSaving ? (
              <CircularProgress size={24} sx={{ color: '#000' }} />
            ) : (
              <>{t('sokhranit')}</>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            bgcolor: '#111',
            color: '#fff',
            border: `1px solid ${snackbar.severity === 'success' ? '#44ff66' : '#ff3366'}`,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default Profile
