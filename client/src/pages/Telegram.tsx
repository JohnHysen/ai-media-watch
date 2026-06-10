import {
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import HomeButton from '../components/HomeButton'
import { useUser } from '../context/user/useUser'
import { bindTg, sendTg } from '../http/API'

const Telegram = () => {
  const { user, sio } = useUser()
  const [searchParams, setSearchParams] = useSearchParams()

  const [msg, setMsg] = useState('')
  const [tgid, setTgid] = useState('')

  const [msgs, setMsgs] = useState<string[]>([])

  const callNotification = (message: string) => {
    if (Notification.permission === 'granted') {
      const _notif = new Notification('Новое сообщение', {
        body: message,
        icon: '/logo.png',
      })
      console.log(_notif)
    }
  }

  const sendMessage = () => {
    sendTg(msg).then((res) => {
      if (res.message) {
        setMsgs((v) => [...v, msg])
        setMsg('')
      }
    })
  }

  useEffect(() => {
    const tg = searchParams.get('tg')
    if (tg) {
      bindTg(tg).then(() => {
        setTgid(tg)
      })
      setSearchParams({})
    }
  }, [])

  useEffect(() => {
    sio?.on('tg_message', (m) => {
      console.log(m)
      setMsgs((v) => [...v, m])
      callNotification(m)
    })

    return () => {
      sio?.removeAllListeners('tg_message')
    }
  }, [sio])

  useEffect(() => {
    if (user.tg_id) setTgid(user.tg_id)
  }, [user.tg_id])
  return (
    <Paper sx={{ p: 3 }} component={Stack} alignItems={'start'}>
      <HomeButton />
      <TextField
        value={tgid}
        onChange={(e) => setTgid(e.target.value)}
        label="Ваш Telegram ID"
      />
      <Divider sx={{ my: 1 }} />
      <TextField
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        label="Сообщение..."
      />
      <Button variant="contained" fullWidth onClick={sendMessage}>
        Отправить
      </Button>
      <Divider sx={{ my: 1 }} />
      {msgs.map((m) => (
        <Typography>{m}</Typography>
      ))}
    </Paper>
  )
}

export default Telegram
