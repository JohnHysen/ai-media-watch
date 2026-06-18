import cors from 'cors'
import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import fileUpload from 'express-fileupload'

import cfg from './config.js'
import router from './routes/index'
import sequelize from './db/db'
import { sio_middleware, sio_chat } from './modules/sio/.'
// Импорт воркера очереди (запускает cron-задачу)
import './modules/cron/analysisQueueProcessor.js'
import {
  createVideoAnalysis,
  getAllVideoAnalyses,
  getAnalysesByUser,
} from './controllers/videoController.js'

const allowedOrigins = [cfg.CLIENT]
const PORT = cfg.PORT
const app = express()

// ✅ 1. Парсеры
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }))

// ✅ 2. CORS
app.use(cors({ origin: allowedOrigins, credentials: true }))

// ✅ 3. Статика
app.use('/static', express.static('static')) // одна строка, дублирование убрано

// ✅ 4. Основные роуты для видео-анализов (прямые, без router)
app.post('/video-analysis', createVideoAnalysis)
app.get('/video-analysis', getAllVideoAnalyses)
app.get('/video-analysis/user/:userId', getAnalysesByUser)

// ✅ 5. Подключаем все остальные роуты (auth, user, queue, proxy)
app.use('/', router)

// ✅ 6. Тестовый маршрут
app.get('/', (req, res) => {
  res.send({ msg: `check on port ${PORT}!` })
})

const server = http.createServer(app)
export const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
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
