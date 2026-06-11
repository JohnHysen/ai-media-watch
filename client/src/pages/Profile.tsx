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
  Switch,
  FormControlLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  IconButton as MuiIconButton,
  Stack,
  Divider,
  TextField,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SecurityIcon from '@mui/icons-material/Security'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import TelegramIcon from '@mui/icons-material/Telegram'
import TikTokIcon from '@mui/icons-material/MusicNote'
import InstagramIcon from '@mui/icons-material/Instagram'
import YouTubeIcon from '@mui/icons-material/YouTube'
import { useUser } from '../context/user/useUser'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'
import CyberSidebar from '../components/CyberSidebar'

// ---------- Компонент планеты (без изменений) ----------
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

// ---------- Космический фон с планетами ----------
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

// ---------- Главный компонент Profile ----------
const Profile = () => {
  const { user } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Состояния для статистики (по умолчанию 0)
  const [stats, setStats] = useState({
    totalChecks: 0,
    threatsFound: 0,
    averageRisk: 0,
    reputation: 0,
  })
  // Состояния для привязанных соцсетей (по умолчанию false)
  const [socials, setSocials] = useState({
    telegram: false,
    instagram: false,
    tiktok: false,
    youtube: false,
  })
  const [loading, setLoading] = useState(true)

  // Загрузка данных при монтировании (закомментировано до появления бэкенда)
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // TODO: Раскомментировать, когда бэкенд готов
        /*
        const [statsData, socialsData] = await Promise.all([
          fetch('/api/user/stats').then(res => res.json()),
          fetch('/api/user/socials').then(res => res.json())
        ])
        setStats(statsData)
        setSocials(socialsData)
        */
        // Пока оставляем значения по умолчанию (0, false)
        console.log(
          'Заглушка: данные профиля будут подгружаться из API после настройки бэкенда'
        )
      } catch (error) {
        console.error('Ошибка загрузки данных профиля:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  // Диалог смены пароля
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Диалог смены аватара
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user?.photoURL || '')

  const handleChangePassword = () => {
    setPasswordError('')
    setPasswordSuccess('')
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Заполните все поля')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Новый пароль и подтверждение не совпадают')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов')
      return
    }
    // TODO: Заменить на реальный API-вызов
    // await updatePassword(oldPassword, newPassword)
    setTimeout(() => {
      setPasswordSuccess('Пароль успешно изменён')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordDialogOpen(false), 1500)
    }, 500)
  }

  const handleChangeAvatar = () => {
    // TODO: Отправить avatarUrl на сервер
    setAvatarDialogOpen(false)
  }

  const handleConnectSocial = (platform: string) => {
    // TODO: Реальный вызов API для привязки аккаунта
    alert(`Привязка ${platform} будет реализована позже`)
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
        <Typography sx={{ color: '#fff' }}>
          Пожалуйста, войдите в систему
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <SpaceBackground />
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
                mb: 4,
                background: 'linear-gradient(135deg, #ff3366, #33ffcc)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Профиль пользователя
            </Typography>
          </motion.div>

          <Grid container spacing={4}>
            {/* Левая колонка */}
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
                      src={avatarUrl || user.photoURL || undefined}
                      sx={{
                        width: 120,
                        height: 120,
                        border: '3px solid #0ff',
                        boxShadow: '0 0 20px #0ff',
                        mx: 'auto',
                      }}
                    >
                      {!avatarUrl &&
                        !user.photoURL &&
                        (user.first_name?.[0] || user.email?.[0])}
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
                    label={
                      user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'
                    }
                    size="small"
                    sx={{ mt: 2, bgcolor: '#ff3366', color: '#fff' }}
                  />
                </Card>

                <Card
                  sx={{
                    mt: 3,
                    bgcolor: 'rgba(10,10,30,0.6)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 4,
                    border: '1px solid rgba(0,255,255,0.3)',
                    p: 2,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#0ff',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <SecurityIcon fontSize="small" /> Безопасность
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={twoFactorEnabled}
                        onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#0ff',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ color: '#fff' }}>
                        Двухфакторная аутентификация
                      </Typography>
                    }
                  />
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setPasswordDialogOpen(true)}
                    sx={{ mt: 2, borderColor: '#ff3366', color: '#ff3366' }}
                  >
                    Сменить пароль
                  </Button>
                </Card>

                <Card
                  sx={{
                    mt: 3,
                    bgcolor: 'rgba(10,10,30,0.6)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 4,
                    border: '1px solid rgba(0,255,255,0.3)',
                    p: 2,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#0ff',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <NotificationsIcon fontSize="small" /> Уведомления
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationsEnabled}
                        onChange={() =>
                          setNotificationsEnabled(!notificationsEnabled)
                        }
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#0ff',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ color: '#fff' }}>
                        Получать уведомления о новых угрозах
                      </Typography>
                    }
                  />
                </Card>
              </motion.div>
            </Grid>

            {/* Правая колонка */}
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
                  <Typography variant="h6" sx={{ color: '#0ff', mb: 2 }}>
                    📊 Ваша активность
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Всего проверок
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ color: '#33ffcc', fontWeight: 'bold' }}
                      >
                        {loading ? 0 : stats.totalChecks}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Найдено угроз
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ color: '#ff6666', fontWeight: 'bold' }}
                      >
                        {loading ? 0 : stats.threatsFound}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Средний риск
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ color: '#ffaa44', fontWeight: 'bold' }}
                      >
                        {loading ? 0 : stats.averageRisk}%
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Репутация
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ color: '#0ff', fontWeight: 'bold' }}
                      >
                        {loading ? 0 : stats.reputation}%
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>

                <Card
                  sx={{
                    bgcolor: 'rgba(10,10,30,0.6)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 4,
                    border: '1px solid rgba(0,255,255,0.3)',
                    p: 3,
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#0ff', mb: 2 }}>
                    🔗 Привязанные аккаунты
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<TelegramIcon />}
                        onClick={() => handleConnectSocial('Telegram')}
                        sx={{
                          justifyContent: 'flex-start',
                          borderColor: '#0ff',
                          color: '#0ff',
                          textTransform: 'none',
                        }}
                      >
                        {socials.telegram
                          ? '✓ Telegram привязан'
                          : 'Привязать Telegram'}
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<InstagramIcon />}
                        onClick={() => handleConnectSocial('Instagram')}
                        sx={{
                          justifyContent: 'flex-start',
                          borderColor: '#e4405f',
                          color: '#e4405f',
                          textTransform: 'none',
                        }}
                      >
                        {socials.instagram
                          ? '✓ Instagram привязан'
                          : 'Привязать Instagram'}
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<TikTokIcon />}
                        onClick={() => handleConnectSocial('TikTok')}
                        sx={{
                          justifyContent: 'flex-start',
                          borderColor: '#00f2ea',
                          color: '#00f2ea',
                          textTransform: 'none',
                        }}
                      >
                        {socials.tiktok
                          ? '✓ TikTok привязан'
                          : 'Привязать TikTok'}
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<YouTubeIcon />}
                        onClick={() => handleConnectSocial('YouTube')}
                        sx={{
                          justifyContent: 'flex-start',
                          borderColor: '#ff0000',
                          color: '#ff0000',
                          textTransform: 'none',
                        }}
                      >
                        {socials.youtube
                          ? '✓ YouTube привязан'
                          : 'Привязать YouTube'}
                      </Button>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 3, borderColor: 'rgba(0,255,255,0.2)' }} />
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Привязка аккаунтов позволит автоматически анализировать ваши
                    видео и получать уведомления об угрозах.
                  </Typography>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Container>

        {/* Диалог смены пароля */}
        <Dialog
          open={passwordDialogOpen}
          onClose={() => setPasswordDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#111', color: '#fff', border: '1px solid #ff3366' },
          }}
        >
          <DialogTitle sx={{ color: '#fff' }}>Смена пароля</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Старый пароль"
                type={showOldPassword ? 'text' : 'password'}
                fullWidth
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                sx={{ input: { color: '#fff' }, label: { color: '#aaa' } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <MuiIconButton
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        edge="end"
                        sx={{ color: '#aaa' }}
                      >
                        {showOldPassword ? <VisibilityOff /> : <Visibility />}
                      </MuiIconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Новый пароль"
                type={showNewPassword ? 'text' : 'password'}
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ input: { color: '#fff' }, label: { color: '#aaa' } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <MuiIconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                        sx={{ color: '#aaa' }}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </MuiIconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Подтвердите пароль"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ input: { color: '#fff' }, label: { color: '#aaa' } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <MuiIconButton
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge="end"
                        sx={{ color: '#aaa' }}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </MuiIconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {passwordError && (
                <Alert
                  severity="error"
                  sx={{ bgcolor: 'rgba(255,51,102,0.2)', color: '#ff8888' }}
                >
                  {passwordError}
                </Alert>
              )}
              {passwordSuccess && (
                <Alert
                  severity="success"
                  sx={{ bgcolor: 'rgba(68,255,102,0.2)', color: '#88ff88' }}
                >
                  {passwordSuccess}
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setPasswordDialogOpen(false)}
              sx={{ color: '#aaa' }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleChangePassword}
              variant="contained"
              sx={{ bgcolor: '#ff3366', color: '#fff' }}
            >
              Изменить
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог смены аватара */}
        <Dialog
          open={avatarDialogOpen}
          onClose={() => setAvatarDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#111', color: '#fff', border: '1px solid #0ff' },
          }}
        >
          <DialogTitle sx={{ color: '#fff' }}>Сменить аватар</DialogTitle>
          <DialogContent>
            <TextField
              label="URL изображения"
              fullWidth
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              sx={{ mt: 1, input: { color: '#fff' }, label: { color: '#aaa' } }}
            />
            <Typography
              variant="caption"
              sx={{ display: 'block', mt: 1, color: '#aaa' }}
            >
              Введите ссылку на изображение (или позже добавим загрузку файла)
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setAvatarDialogOpen(false)}
              sx={{ color: '#aaa' }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleChangeAvatar}
              variant="contained"
              sx={{ bgcolor: '#0ff', color: '#000' }}
            >
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  )
}

export default Profile
