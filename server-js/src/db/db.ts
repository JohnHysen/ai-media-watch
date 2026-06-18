import { Sequelize } from 'sequelize-typescript'
import cfg from '../config.js'

// Импорт моделей
import { User } from './models/user.js'
import { VideoAnalysis } from './models/VideoAnalysis.js'
import { AnalysisQueue } from './models/AnalysisQueue.js'

// Создаём подключение к PostgreSQL
const sequelize = new Sequelize({
  database: cfg.DB_NAME,
  username: cfg.DB_USER,
  password: cfg.DB_PASSWORD,
  host: cfg.DB_HOST,
  port: cfg.DB_PORT,
  dialect: 'postgres',
  models: [User, VideoAnalysis, AnalysisQueue], // ✅ добавлена AnalysisQueue
  logging: console.log, // для дебага
})

// Экспортируем всё необходимое
export { User, VideoAnalysis, AnalysisQueue }
export default sequelize
