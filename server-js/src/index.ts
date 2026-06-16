import cors from 'cors'
import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import fileUpload from 'express-fileupload'

import cfg from './config.js'
import router from './routes/index'
import sequelize from './db/db'
import { sio_middleware, sio_chat } from './modules/sio/.'
import './modules/cron/.'
import {
  createVideoAnalysis,
  getAllVideoAnalyses,
} from './controllers/videoController.js'
import { getAnalysesByUser } from './controllers/videoController.js'

const allowedOrigins = [cfg.CLIENT]
const PORT = cfg.PORT
const app = express()

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }))
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use('/static', express.static('static'))

// ✅ Все роуты идут через router (включая прокси)

app.post('/video-analysis', createVideoAnalysis)
app.get('/video-analysis', getAllVideoAnalyses)
app.get('/video-analysis/user/:userId', getAnalysesByUser)
app.use('/', router) // здесь теперь и прокси, и auth, и user

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
