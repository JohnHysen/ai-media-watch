import { Sequelize } from 'sequelize-typescript'
import cfg from '../config.js'

// Импорт моделей
import { User } from './models/user'

// Создаём подключение к PostgreSQL
const sequelize = new Sequelize({
  database: cfg.DB_NAME,
  username: cfg.DB_USER,
  password: cfg.DB_PASSWORD,
  host: cfg.DB_HOST,
  port: cfg.DB_PORT,
  dialect: 'postgres',
  models: [User], // все модели
  logging: console.log, // для дебага
})

export { User }
export default sequelize
