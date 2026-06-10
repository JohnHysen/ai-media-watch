import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import RootLayout from './components/RootLayout.tsx'

import Map from './pages/Map.tsx'
import Menu from './pages/Menu.tsx'
import NotFound from './pages/NotFound.tsx'
import QR from './pages/QR.tsx'
import Telegram from './pages/Telegram.tsx'
import Translations from './pages/Translations.tsx'

import 'leaflet/dist/leaflet.css'
import './index.css'

import './i18n'
import WithAuth from './components/WithAuth.tsx'
import Email from './pages/Email.tsx'
import Charts from './pages/Charts.tsx'
import MessengerNew from './pages/MessengerNew.tsx'
import AdminCharacters from './pages/AdminCharacters.tsx'
import AdminBalances from './pages/AdminBalances.tsx'
import UserCharacters from './pages/UserCharacters.tsx' // 👈 импорт новой страницы
import AdminTags from './pages/AdminTags'
import UserEditCharacters from './pages/UserEditCharacters'
import AdminEditCharacters from './pages/AdminEditCharacters'

const font = 'teletext, "Roboto", "Arial", sans-serif'

const theme = createTheme({
  typography: {
    fontFamily: font,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: font,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          fontFamily: font,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: font,
        },
      },
    },
  },
})

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Menu /> },
      {
        path: 'messenger',
        element: <WithAuth c={<MessengerNew />} roles={['USER', 'ADMIN']} />,
      },
      {
        path: '/1-telegram',
        element: <WithAuth c={<Telegram />} roles={['USER', 'ADMIN']} />,
      },
      {
        path: '/2-email',
        element: <WithAuth c={<Email />} roles={['USER', 'ADMIN']} />,
      },
      {
        path: '/4-leaflet',
        element: <WithAuth c={<Map />} roles={['USER', 'ADMIN']} />,
      },
      {
        path: '/5-i18n',
        element: <WithAuth c={<Translations />} roles={['USER', 'ADMIN']} />,
      },
      {
        path: '/8-qr',
        element: <WithAuth c={<QR />} roles={['USER', 'ADMIN']} />,
      },
      {
        path: '/9-charts',
        element: <WithAuth c={<Charts />} roles={['ADMIN']} />,
      },
      {
        path: '/admin/characters',
        element: <WithAuth c={<AdminCharacters />} roles={['ADMIN']} />,
      },
      {
        path: '/admin/balances',
        element: <WithAuth c={<AdminBalances />} roles={['ADMIN']} />,
      },
      // 👇 новый маршрут для создания персонажа (доступен USER и ADMIN)
      {
        path: '/create-character',
        element: <WithAuth c={<UserCharacters />} roles={['USER']} />,
      },
      { path: '*', element: <NotFound /> },
      {
        path: '/admin/tags',
        element: <WithAuth c={<AdminTags />} roles={['ADMIN']} />,
      },
      {
        path: '/my-characters',
        element: (
          <WithAuth c={<UserEditCharacters />} roles={['USER', 'ADMIN']} />
        ),
      },
      {
        path: '/admin/characters-edit',
        element: <WithAuth c={<AdminEditCharacters />} roles={['ADMIN']} />,
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <RouterProvider router={router} />
    <ToastContainer theme="colored" />
  </ThemeProvider>
  // </StrictMode>
)
