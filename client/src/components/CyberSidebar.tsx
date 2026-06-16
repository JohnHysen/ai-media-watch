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
  Switch,
  FormControlLabel,
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
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/user/useUser'
import { useTranslation } from 'react-i18next'
import { signIn, signUp } from '../http/API'

// Импортируем тип UserData из UserProvider
import { UserData } from '../context/user/UserProvider'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CyberSidebar({ open, onClose }: Props) {
  const { user, login, logout } = useUser()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [darkMode, setDarkMode] = useState(true)
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

  // Состояние загрузки и ошибок
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNavigation = (path: string) => {
    navigate(path)
    onClose()
  }

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/')
  }

  // ✅ Реальный вход через API с преобразованием id → user_id
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
        // Преобразуем id → user_id
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

  // ✅ Реальная регистрация через API с преобразованием id → user_id
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
        // Преобразуем id → user_id
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

  const menuItems = [
    { text: 'Главная', icon: <DashboardIcon />, path: '/' },
    { text: 'Профиль', icon: <PersonIcon />, path: '/profile' },
    { text: 'История проверок', icon: <HistoryIcon />, path: '/history' },
    { text: 'Аналитика угроз', icon: <AnalyticsIcon />, path: '/analytics' },
  ]

  const isAuthenticated = !!user?.role

  return (
    <>
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
          {/* Заголовок и кнопка закрытия */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid rgba(0,255,255,0.2)',
            }}
          >
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

          {/* Профиль пользователя (если авторизован) */}
          {isAuthenticated ? (
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid rgba(0,255,255,0.2)',
                mb: 2,
              }}
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

          {/* Список навигации */}
          <List sx={{ flex: 1, px: 1 }}>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: 'rgba(0, 255, 255, 0.1)',
                    transform: 'translateX(4px)',
                    transition: '0.2s',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#0ff', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ borderColor: 'rgba(0,255,255,0.2)', my: 1 }} />

          {/* Дополнительные настройки */}
          <Box sx={{ p: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#0ff' },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {darkMode ? (
                    <DarkModeIcon fontSize="small" sx={{ color: '#0ff' }} />
                  ) : (
                    <LightModeIcon fontSize="small" />
                  )}
                  <Typography variant="body2">Тёмная тема</Typography>
                </Box>
              }
            />
          </Box>

          <Divider sx={{ borderColor: 'rgba(0,255,255,0.2)' }} />

          {/* Кнопка выхода */}
          {isAuthenticated && (
            <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                startIcon={<LogoutIcon />}
                onClick={() => setLogoutConfirmOpen(true)}
                sx={{
                  color: '#ff3366',
                  borderColor: '#ff3366',
                  '&:hover': { bgcolor: 'rgba(255,51,102,0.1)' },
                }}
              >
                Выйти
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Диалог подтверждения выхода */}
      <Dialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#111', color: '#fff', border: '1px solid #ff3366' },
        }}
      >
        <DialogTitle>Выход из системы</DialogTitle>
        <DialogContent>Вы уверены, что хотите выйти?</DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutConfirmOpen(false)}>Отмена</Button>
          <Button onClick={handleLogout} sx={{ color: '#ff3366' }}>
            Выйти
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог авторизации (вход / регистрация) */}
      <Dialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#111',
            color: '#fff',
            border: '1px solid #0ff',
            borderRadius: 3,
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

          {/* Форма входа */}
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

          {/* Форма регистрации */}
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
