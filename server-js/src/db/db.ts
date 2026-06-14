import { Sequelize } from 'sequelize-typescript'
import cfg from '../config.js'

// Импорт моделей
import { User } from './models/user.js'
import { VideoAnalysis } from './models/VideoAnalysis.js' // добавь импорт

// Создаём подключение к PostgreSQL
const sequelize = new Sequelize({
  database: cfg.DB_NAME,
  username: cfg.DB_USER,
  password: cfg.DB_PASSWORD,
  host: cfg.DB_HOST,
  port: cfg.DB_PORT,
  dialect: 'postgres',
  models: [User, VideoAnalysis], // добавили VideoAnalysis
  logging: console.log, // для дебага
})

// Экспортируем всё необходимое
export { User, VideoAnalysis }
export default sequelize
