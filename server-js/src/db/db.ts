import { Sequelize } from 'sequelize-typescript'
import cfg from '../config.js'

import { User } from './models/user.js'
import { VideoAnalysis } from './models/VideoAnalysis.js'
import { AnalysisQueue } from './models/AnalysisQueue.js'
import { SystemSettings } from './models/SystemSettings.js'
import { Direction } from './models/Direction'

// Импортируем enum из файла модели (он не должен быть в models)
import { TikTokLive } from '../db/models/TikTokLive.js'

const sequelize = new Sequelize({
  database: cfg.DB_NAME,
  username: cfg.DB_USER,
  password: cfg.DB_PASSWORD,
  host: cfg.DB_HOST,
  port: cfg.DB_PORT,
  dialect: 'postgres',
  models: [
    User,
    VideoAnalysis,
    AnalysisQueue,
    SystemSettings,
    Direction,
    TikTokLive,
    // VerdictText – убираем, это не модель
  ],
  logging: console.log,
})

export {
  User,
  VideoAnalysis,
  AnalysisQueue,
  SystemSettings,
  Direction,
  TikTokLive,
}
export default sequelize
