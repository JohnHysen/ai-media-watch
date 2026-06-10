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
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SearchIcon from '@mui/icons-material/Search'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import ApiIcon from '@mui/icons-material/Api'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import SecurityIcon from '@mui/icons-material/Security'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/user/useUser'
import { useTranslation } from 'react-i18next'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CyberSidebar({ open, onClose }: Props) {
  const { user, logout } = useUser()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [darkMode, setDarkMode] = useState(true) // для демо, можно позже связать с темой
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  const handleNavigation = (path: string) => {
    navigate(path)
    onClose()
  }

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/')
  }

  // Основные пункты меню для AI Media Watch
  const menuItems = [
    { text: 'Дашборд', icon: <DashboardIcon />, path: '/' },
    { text: 'Проверка видео', icon: <SearchIcon />, path: '/check' },
    { text: 'Аналитика угроз', icon: <AnalyticsIcon />, path: '/analytics' },
    { text: 'API Docs', icon: <ApiIcon />, path: '/api-docs' },
    { text: 'Настройки', icon: <SettingsIcon />, path: '/settings' },
  ]

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
          {user ? (
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
                  {!user.photoURL && user.first_name?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {user.first_name} {user.last_name}
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
                onClick={() => handleNavigation('/login')}
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
          {user && (
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
    </>
  )
}
