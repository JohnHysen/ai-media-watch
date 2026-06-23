import { ExtendedError, Socket } from 'socket.io'
import jwt, { JwtPayload } from 'jsonwebtoken'
import cfg from '../../config'
import { User } from '../../db/index.js'

const userSockets = new Map<number, Socket>()

export interface SocketU extends Socket {
  user_id?: number
}

export const sio_middleware = (
  socket: SocketU,
  next: (err?: ExtendedError | undefined) => void
) => {
  const token = socket.handshake.auth.token
  if (!token) return next(new Error('No token provided'))
  try {
    const decoded = jwt.verify(token, cfg.SECRET_KEY) as JwtPayload
    const user_id = decoded.id
    if (user_id) {
      console.log(user_id)
      socket.user_id = user_id
    }
    next()
  } catch {
    return next(new Error('Invalid token'))
  }
}

export const sio_chat = (socket: SocketU) => {
  console.log('User connected', socket.id)

  if (socket.user_id) {
    userSockets.set(socket.user_id, socket)
    User.update(
      { is_online: true, last_seen: new Date() },
      { where: { id: socket.user_id } }
    ).catch((err) => console.error('Failed to update online status:', err))
  }
  22222
  socket.on('llmmessage', async (data) => {
    console.log('🔥 llmmessage data:', JSON.stringify(data, null, 2))
    const { characterId, message = 'text' } = data
    if (!characterId || !message) {
      socket.emit('llmmessage', 'Ошибка: не указан персонаж или сообщение')
      return
    }

    const userId = socket.user_id
    if (!userId) {
      socket.emit('llmmessage', 'Ошибка авторизации')
      return
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('Disconnected user:', socket.id, 'reason:', reason)
    if (socket.user_id) {
      userSockets.delete(socket.user_id)
      User.update(
        { is_online: false, last_seen: new Date() },
        { where: { id: socket.user_id } }
      ).catch((err) => console.error('Failed to update offline status:', err))
    }
  })
}

export function notifyVideoCheckCompleted(userId: number, checkData: any) {
  const socket = userSockets.get(userId)
  if (socket) {
    socket.emit('video-check-completed', checkData)
    console.log(`✅ Уведомление о видео отправлено пользователю ${userId}`)
  } else {
    console.log(
      `⚠️ Пользователь ${userId} не в сети, уведомление не отправлено`
    )
  }
}
