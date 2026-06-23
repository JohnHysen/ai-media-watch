import React, { useState } from 'react'
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Button,
  Stack,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tab,
  Tabs,
  InputAdornment,
  IconButton as MuiIconButton,
  CircularProgress,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DashboardIcon from '@mui/icons-material/Dashboard'
import HistoryIcon from '@mui/icons-material/History'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import LogoutIcon from '@mui/icons-material/Logout'
import QueueIcon from '@mui/icons-material/Queue'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import SettingsIcon from '@mui/icons-material/Settings'
import WarningIcon from '@mui/icons-material/Warning'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/user/useUser'
import { useTranslation } from 'react-i18next'
import { signIn, signUp } from '../http/API'
import { UserData } from '../context/user/UserProvider'

// Импорт framer-motion для анимации
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CyberSidebar({ open, onClose }: Props) {
  const { user, login, logout } = useUser()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Состояния для диалога выхода
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  // Состояния для диалога авторизации
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authTab, setAuthTab] = useState(0) // 0 - вход, 1 - регистрация

  // Поля входа
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Поля регистрации
  const [regFirstName, setRegFirstName] = useState('')
  const [regLastName, setRegLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false)

  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  const isAuthenticated = !!user?.role
  const isAdmin = user?.role === 'ADMIN'
  const isInspector = user?.role === 'INSPECTOR'

  // Навигация по пунктам меню
  const handleNavigation = (path: string) => {
    navigate(path)
    onClose()
  }

  // Выход из системы — закрываем диалог и выходим
  const handleLogout = () => {
    setLogoutConfirmOpen(false) // закрываем диалог
    logout()
    onClose()
    navigate('/')
  }

  // === Вход через API ===
  const handleLogin = async () => {
    setAuthError('')
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthError('Заполните все поля')
      return
    }
    setLoading(true)
    try {
      const res = await signIn(loginEmail, loginPassword)
      if (res && res.token && res.user) {
        const userData: UserData = {
          user_id: res.user.id,
          role: res.user.role,
          first_name: res.user.first_name || '',
          last_name: res.user.last_name || '',
          email: res.user.email || '',
          photoURL: res.user.photoURL || '',
          tg_id: res.user.tg_id || null,
          is_google: res.user.is_google || false,
        }
        login(userData, res.token)
        setAuthDialogOpen(false)
        setLoginEmail('')
        setLoginPassword('')
      } else {
        setAuthError('Ошибка входа: сервер не вернул данные')
      }
    } catch (err: any) {
      setAuthError(err?.response?.data?.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  // === Регистрация через API ===
  const handleRegister = async () => {
    setAuthError('')
    if (
      !regFirstName.trim() ||
      !regLastName.trim() ||
      !regEmail.trim() ||
      !regPassword.trim() ||
      !regConfirmPassword.trim()
    ) {
      setAuthError('Заполните все поля')
      return
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError('Пароли не совпадают')
      return
    }
    if (regPassword.length < 6) {
      setAuthError('Пароль должен быть не менее 6 символов')
      return
    }
    setLoading(true)
    try {
      const res = await signUp(regFirstName, regLastName, regEmail, regPassword)
      if (res && res.token && res.user) {
        const userData: UserData = {
          user_id: res.user.id,
          role: res.user.role,
          first_name: res.user.first_name || '',
          last_name: res.user.last_name || '',
          email: res.user.email || '',
          photoURL: res.user.photoURL || '',
          tg_id: res.user.tg_id || null,
          is_google: res.user.is_google || false,
        }
        login(userData, res.token)
        setAuthDialogOpen(false)
        setRegFirstName('')
        setRegLastName('')
        setRegEmail('')
        setRegPassword('')
        setRegConfirmPassword('')
      } else {
        setAuthError('Ошибка регистрации: сервер не вернул данные')
      }
    } catch (err: any) {
      setAuthError(err?.response?.data?.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const handleAuthTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setAuthTab(newValue)
    setAuthError('')
  }

  // === Пункты меню ===
  const baseMenuItems = [
    { text: 'Главная', icon: <DashboardIcon />, path: '/' },
    { text: 'История проверок', icon: <HistoryIcon />, path: '/history' },
    { text: 'Аналитика угроз', icon: <AnalyticsIcon />, path: '/analytics' },
  ]

  const roleMenuItems = []
  if (isAdmin || isInspector) {
    roleMenuItems.push({
      text: 'Управление очередью',
      icon: <QueueIcon />,
      path: '/queue',
    })
    roleMenuItems.push({
      text: 'Реестр мош. ресурсов',
      icon: <WarningIcon />,
      path: '/admin/fraud-resources',
    })
  }
  if (isAdmin) {
    roleMenuItems.push({
      text: 'Управление пользователями',
      icon: <AdminPanelSettingsIcon />,
      path: '/users',
    })
    roleMenuItems.push({
      text: 'Настройки системы',
      icon: <SettingsIcon />,
      path: '/settings',
    })
  }
  const menuItems = [...baseMenuItems, ...roleMenuItems]

  return (
    <>
      {/* ====== БОКОВОЕ МЕНЮ (Drawer) ====== */}
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        SlideProps={{ timeout: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
          },
        }}
        PaperProps={{
          sx: {
            width: { xs: '85%', sm: 320 },
            bgcolor: 'rgba(5, 5, 20, 0.95)',
            backdropFilter: 'blur(16px)',
            borderRight: '1px solid rgba(0, 255, 255, 0.3)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)',
            overflow: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            color: '#fff',
          }}
        >
          {/* Заголовок */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid rgba(0,255,255,0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                component="img"
                src="/logo.png"
                alt="AI Media Watch"
                sx={{ height: 32, width: 'auto' }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #ff3366, #33ffcc)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                AI MEDIA WATCH
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                color: '#0ff',
                '&:hover': { transform: 'rotate(90deg)', transition: '0.3s' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Профиль пользователя */}
          {isAuthenticated ? (
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid rgba(0,255,255,0.2)',
                mb: 2,
                cursor: 'pointer',
                transition: '0.2s',
                '&:hover': {
                  bgcolor: 'rgba(0,255,255,0.05)',
                  borderRadius: 1,
                },
              }}
              onClick={() => handleNavigation('/profile')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={user.photoURL || undefined}
                  sx={{
                    width: 48,
                    height: 48,
                    border: '2px solid #0ff',
                    boxShadow: '0 0 10px #0ff',
                  }}
                >
                  {!user.photoURL &&
                    (user.first_name?.[0] || user.email?.[0] || 'U')}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {user.first_name || user.email?.split('@')[0]}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#88f' }}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid rgba(0,255,255,0.2)',
                mb: 2,
              }}
            >
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setAuthDialogOpen(true)}
                sx={{
                  borderColor: '#0ff',
                  color: '#0ff',
                  '&:hover': { bgcolor: 'rgba(0,255,255,0.1)' },
                }}
              >
                Войти / Регистрация
              </Button>
            </Box>
          )}

          {/* Навигация */}
          <List sx={{ flex: 1, px: 1 }}>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(0, 255, 255, 0.15)',
                    transform: 'translateX(8px)',
                    boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#0ff',
                    transition: '0.2s',
                  },
                  '&:hover .MuiListItemIcon-root': {
                    color: '#33ffcc',
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#0ff', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: 500,
                    sx: {
                      transition: '0.2s',
                      '&:hover': { color: '#33ffcc' },
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ borderColor: 'rgba(0,255,255,0.2)', my: 1 }} />

          {/* Кнопка выхода (только для авторизованных) */}
          {isAuthenticated && (
            <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                startIcon={<LogoutIcon />}
                onClick={() => setLogoutConfirmOpen(true)}
                sx={{
                  border: '1px solid rgba(255,51,102,0.5)',
                  color: '#ff3366',
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: 'rgba(255,51,102,0.15)',
                    borderColor: '#ff3366',
                    boxShadow: '0 0 20px rgba(255,51,102,0.3)',
                    transform: 'scale(1.02)',
                  },
                }}
              >
                Выйти
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* ====== НОВЫЙ КИБЕР-ДИАЛОГ ВЫХОДА ====== */}
      <Dialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible',
          },
        }}
      >
        <AnimatePresence>
          {logoutConfirmOpen && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateX: 20 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateX: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                background: 'rgba(10, 10, 30, 0.96)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '2px solid rgba(255, 51, 102, 0.7)',
                boxShadow:
                  '0 0 60px rgba(255, 51, 102, 0.4), inset 0 0 30px rgba(255, 51, 102, 0.1)',
                padding: '24px 20px 20px',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Декоративные фоновые круги */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  background:
                    'radial-gradient(circle, rgba(255,51,102,0.15) 0%, transparent 70%)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -80,
                  left: -80,
                  width: 250,
                  height: 250,
                  background:
                    'radial-gradient(circle, rgba(0,255,255,0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />

              <DialogTitle
                sx={{
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: '1.8rem',
                  letterSpacing: 2,
                  background: 'linear-gradient(135deg, #ff3366, #ff6633)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0 0 30px rgba(255,51,102,0.5)',
                  pb: 1,
                  position: 'relative',
                }}
              >
                ⚠️ ВЫХОД
              </DialogTitle>

              <DialogContent
                sx={{
                  textAlign: 'center',
                  py: 2,
                  position: 'relative',
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: 'easeInOut',
                  }}
                  style={{ display: 'inline-block' }}
                >
                  <Box
                    component="span"
                    sx={{
                      fontSize: 64,
                      display: 'block',
                      mb: 1,
                      filter: 'drop-shadow(0 0 20px #ff3366)',
                    }}
                  >
                    🔐
                  </Box>
                </motion.div>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#fff',
                    textShadow: '0 0 20px rgba(255,51,102,0.3)',
                    mb: 1,
                  }}
                >
                  Вы уверены, что хотите выйти?
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    maxWidth: 280,
                    mx: 'auto',
                  }}
                >
                  Все несохранённые данные будут потеряны.
                </Typography>
              </DialogContent>

              <DialogActions
                sx={{
                  justifyContent: 'center',
                  gap: 2,
                  pt: 1,
                  pb: 0,
                  position: 'relative',
                }}
              >
                <Button
                  onClick={() => setLogoutConfirmOpen(false)}
                  variant="outlined"
                  sx={{
                    borderColor: '#0ff',
                    color: '#0ff',
                    px: 4,
                    py: 1,
                    borderRadius: 30,
                    fontWeight: 600,
                    letterSpacing: 1,
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: 'rgba(0,255,255,0.15)',
                      borderColor: '#33ffcc',
                      boxShadow: '0 0 30px rgba(0,255,255,0.4)',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #ff3366, #ff0055)',
                    color: '#fff',
                    px: 4,
                    py: 1,
                    borderRadius: 30,
                    fontWeight: 600,
                    letterSpacing: 1,
                    boxShadow: '0 0 20px rgba(255,51,102,0.5)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ff0055, #cc0044)',
                      boxShadow: '0 0 40px rgba(255,51,102,0.8)',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  Выйти
                </Button>
              </DialogActions>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>

      {/* ====== ДИАЛОГ АВТОРИЗАЦИИ (без изменений, но стилизован под кибер) ====== */}
      <Dialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(10,10,30,0.96)',
            backdropFilter: 'blur(16px)',
            color: '#fff',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: 4,
            boxShadow: '0 0 40px rgba(0, 255, 255, 0.2)',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(0,255,255,0.2)' }}>
          <Tabs
            value={authTab}
            onChange={handleAuthTabChange}
            sx={{ '& .MuiTabs-indicator': { bgcolor: '#0ff' } }}
          >
            <Tab
              label="Вход"
              sx={{ color: '#fff', '&.Mui-selected': { color: '#0ff' } }}
            />
            <Tab
              label="Регистрация"
              sx={{ color: '#fff', '&.Mui-selected': { color: '#0ff' } }}
            />
          </Tabs>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {authError && (
            <Alert
              severity="error"
              sx={{ mb: 2, bgcolor: 'rgba(255,51,102,0.2)', color: '#ff8888' }}
            >
              {authError}
            </Alert>
          )}

          {authTab === 0 && (
            <Stack spacing={2}>
              <TextField
                label="Email"
                fullWidth
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                sx={{ input: { color: '#fff' }, label: { color: '#aaa' } }}
                InputProps={{
                  sx: {
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#0ff' },
                  },
                }}
              />
              <TextField
                label="Пароль"
                type={showLoginPassword ? 'text' : 'password'}
                fullWidth
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                sx={{ input: { color: '#fff' }, label: { color: '#aaa' } }}
                InputProps={{
                  sx: {
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#0ff' },
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <MuiIconButton
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        edge="end"
                        sx={{ color: '#aaa' }}
                      >
                        {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                      </MuiIconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          )}

          {authTab === 1 && (
            <Stack spacing={2}>
              <TextField
                label="Имя"
                fullWidth
                value={regFirstName}
                onChange={(e) => setRegFirstName(e.target.value)}
                sx={{ input: { color: '#fff' }, label: { color: '#aaa' } }}
                InputProps={{
                  sx: {
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#0ff' },
                  },
                }}
              />
              <TextField
                label="Фамилия"
                fullWidth
                value={regLastName}
                onChange={(e) => setRegLastName(e.target.value)}
                sx={{ input: { color: '#fff' }, label: { color: '#aaa' } }}
                InputProps={{
                  sx: {
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#0ff' },
                  },
                }}
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                sx={{ input: { color: '#fff' }, label: { color: '#aaa' } }}
                InputProps={{
                  sx: {
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#0ff' },
                  },
                }}
              />
              <TextField
                label="Пароль"
                type={showRegPassword ? 'text' : 'password'}
                fullWidth
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                sx={{ input: { color: '#fff' }, label: { color: '#aaa' } }}
                InputProps={{
                  sx: {
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#0ff' },
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <MuiIconButton
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        edge="end"
                        sx={{ color: '#aaa' }}
                      >
                        {showRegPassword ? <VisibilityOff /> : <Visibility />}
                      </MuiIconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Повторите пароль"
                type={showRegConfirmPassword ? 'text' : 'password'}
                fullWidth
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                sx={{ input: { color: '#fff' }, label: { color: '#aaa' } }}
                InputProps={{
                  sx: {
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#0ff' },
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <MuiIconButton
                        onClick={() =>
                          setShowRegConfirmPassword(!showRegConfirmPassword)
                        }
                        edge="end"
                        sx={{ color: '#aaa' }}
                      >
                        {showRegConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </MuiIconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setAuthDialogOpen(false)}
            sx={{ color: '#aaa' }}
          >
            Отмена
          </Button>
          <Button
            onClick={authTab === 0 ? handleLogin : handleRegister}
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: '#0ff',
              color: '#000',
              '&:hover': { bgcolor: '#33ffcc' },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: '#000' }} />
            ) : authTab === 0 ? (
              'Войти'
            ) : (
              'Зарегистрироваться'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
