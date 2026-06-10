import KeyboardReturn from '@mui/icons-material/KeyboardReturn'
import Warning from '@mui/icons-material/Warning'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../context/user/useUser'

interface IWithAuth {
  c: JSX.Element
  roles: ('USER' | 'ADMIN')[]
}

const WithAuth = ({ c, roles }: IWithAuth) => {
  const { user } = useUser()

  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (user.role && roles.includes(user.role)) {
      setAuthorized(true)
    }
  }, [user])

  return authorized ? (
    c
  ) : (
    <Dialog open hideBackdrop>
      <DialogTitle>
        <Stack direction={'row'} gap={1} alignItems={'center'}>
          <Warning /> Недостаточно прав!
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          У вас недостаточно прав доступа для просмотра этой страницы.
          Пожалуйста, вернитесь на главную страницу с помощью кнопки "Вернуться"
          и авторизуйтесь.
        </Typography>
        <Typography>Разрешенные роли: {roles.join(', ')}</Typography>
        <Typography>Ваша роль: {user.role || 'Неавторизован'}</Typography>
      </DialogContent>
      <DialogActions>
        <Link to="/">
          <Button startIcon={<KeyboardReturn />} variant="contained">
            Вернуться
          </Button>
        </Link>
      </DialogActions>
    </Dialog>
  )
}

export default WithAuth
