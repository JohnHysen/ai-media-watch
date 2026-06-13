import { ExtendedError, Socket } from 'socket.io'
import jwt, { JwtPayload } from 'jsonwebtoken'
import cfg from '../../config'
import { User } from '../../db/index.js'
import path from 'node:path'

// Хранилище активных сокетов пользователей (userId -> socket)
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

  // Сохраняем сокет в Map
  if (socket.user_id) {
    userSockets.set(socket.user_id, socket)
    // Обновляем статус онлайн при подключении
    User.update(
      { is_online: true, last_seen: new Date() },
      { where: { id: socket.user_id } }
    ).catch((err) => console.error('Failed to update online status:', err))
  }

  // Обработка LLM-сообщений (существующий код, можно оставить как есть)
  socket.on('llmmessage', async (data) => {
    console.log('🔥 llmmessage data:', JSON.stringify(data, null, 2))
    const { characterId, message, responseMode = 'text' } = data
    if (!characterId || !message) {
      socket.emit('llmmessage', 'Ошибка: не указан персонаж или сообщение')
      return
    }

    const userId = socket.user_id
    if (!userId) {
      socket.emit('llmmessage', 'Ошибка авторизации')
      return
    }

    // ... здесь ваш существующий код обработки сообщений (загрузка персонажа, вызов LLM и т.д.) ...
    // Для краткости опущен, но вы можете вставить свой код.
  })

  socket.on('disconnect', (reason) => {
    console.log('Disconnected user:', socket.id, 'reason:', reason)
    if (socket.user_id) {
      userSockets.delete(socket.user_id)
      // Обновляем статус оффлайн при отключении
      User.update(
        { is_online: false, last_seen: new Date() },
        { where: { id: socket.user_id } }
      ).catch((err) => console.error('Failed to update offline status:', err))
    }
  })
}

// Функция для отправки уведомления о завершении проверки видео
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
