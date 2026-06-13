import cors from 'cors'
import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import fileUpload from 'express-fileupload'

import cfg from './config.js'
import router from './routes/.'
import sequelize from './db/db.js'
import { sio_middleware, sio_chat } from './modules/sio/.'
// import bot from './modules/telegram/.'
import './modules/cron/.'

const allowedOrigins = [cfg.CLIENT]
const PORT = cfg.PORT
const app = express()

// bot.launch()

// ✅ 1. Парсеры (должны быть до роутов)
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }))

// ✅ 2. CORS
app.use(cors({ origin: allowedOrigins, credentials: true }))

// ✅ 3. Статика
app.use('/static', express.static('static'))

// ✅ 4. Роуты
app.use('/', router)

// ✅ 5. Тестовый маршрут
app.get('/', (req, res) => {
  res.send({ msg: `check on port ${PORT}!` })
})

const server = http.createServer(app)
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
  path: '/ws',
  transports: ['websocket'],
})

io.use(sio_middleware)
io.on('connection', sio_chat)

const start = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync({ alter: true })

    server.listen(PORT, () => console.log(`Server started on port ${PORT}`))
  } catch (e) {
    console.log(e)
  }
}

start()
