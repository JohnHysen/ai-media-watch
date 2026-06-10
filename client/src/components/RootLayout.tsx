import { Outlet } from 'react-router-dom'
import { UserProvider } from '../context/user/UserProvider'

const RootLayout = () => (
  <UserProvider>
    <Outlet />
  </UserProvider>
)

export default RootLayout
