import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Paper,
  Typography,
} from '@mui/material'
import { useUser } from '../context/user/useUser'
import { useEffect, useState } from 'react'
import { confirmEmail, sendEmail } from '../http/API'
import { useSearchParams } from 'react-router-dom'
import HomeButton from '../components/HomeButton'

const Email = () => {
  const { user, setUser } = useUser()
  const [sending, setSending] = useState(false)
  const [searchParams] = useSearchParams()

  const submit = () => {
    setSending(true)
    sendEmail().then(() => {
      setSending(false)
    })
  }
  useEffect(() => {
    const secret = searchParams.get('secret')
    if (secret) {
      confirmEmail(secret).then((e) => {
        if (e) {
          user.active = true
          setUser((i) => ({ ...i, active: true }))
        }
      })
    }
  }, [searchParams])

  return (
    <>
      <Paper>
        <HomeButton />
        <Typography>Почта подтверждена!</Typography>
      </Paper>
      <Dialog open={!user.active}>
        <DialogTitle>Подтвердите вашу почту</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 5 }}>
            Сервис будет доступен Вам после подтверждения почты. Пожалуйста,
            проверьте входящие письма по адресу {user.email} и перейдите по
            ссылке в нашем письме подтверждения.
          </DialogContentText>
          <DialogContentText>
            Если письма нет в Вашем ящике, проверьте папку &quot;Спам&quot; или
            запросите повторную отправку письма.
          </DialogContentText>
          <DialogActions>
            <Button loading={sending} onClick={submit}>
              Отправить письмо заново
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Email
