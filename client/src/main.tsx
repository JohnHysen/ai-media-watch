import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import RootLayout from './components/RootLayout.tsx'

import Menu from './pages/Menu.tsx'

import 'leaflet/dist/leaflet.css'
import './index.css'

import './i18n'
import WithAuth from './components/WithAuth.tsx'
import Profile from './pages/Profile.tsx'
import History from './pages/History'
import Analytics from './pages/Analytics'
import AdminUsers from './pages/AdminUsers'
import AdminSettings from './pages/AdminSettings.tsx'
import QueueManager from './pages/QueueManager'
import FraudResources from './pages/FraudResources.tsx'
import DirectionsManagement from './pages/DirectionsManagement'
import TikTokLiveStats from './pages/TikTokLiveStats'

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
        path: '/profile',
        element: <Profile />,
      },
      {
        path: '/history',
        element: <History />,
      },
      {
        path: '/analytics',
        element: <Analytics />,
      },
      {
        path: '/users',
        element: <WithAuth c={<AdminUsers />} roles={['ADMIN']} />,
      },
      {
        path: '/settings',
        element: <WithAuth c={<AdminSettings />} roles={['ADMIN']} />,
      },
      {
        path: '/queue',
        element: (
          <WithAuth c={<QueueManager />} roles={['INSPECTOR', 'ADMIN']} />
        ),
      },
      {
        path: '/admin/fraud-resources',
        element: <FraudResources />,
      },
      {
        path: '/directions',
        element: <WithAuth c={<DirectionsManagement />} roles={['ADMIN']} />,
      },
      {
        path: '/tiktok-live',
        element: (
          <WithAuth c={<TikTokLiveStats />} roles={['INSPECTOR', 'ADMIN']} />
        ),
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
