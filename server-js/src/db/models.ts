import sequelize from './db'
import { User } from './models/user'
import { VideoAnalysis } from './models/VideoAnalysis'
import { AnalysisQueue, QueueStatus } from './models/AnalysisQueue'
import { SystemSettings } from './models/SystemSettings'
import { Direction } from './models/Direction'
import { TikTokLive } from './models/TikTokLive'

sequelize.addModels([
  User,
  VideoAnalysis,
  AnalysisQueue,
  SystemSettings,
  TikTokLive,
])

export {
  User,
  VideoAnalysis,
  AnalysisQueue,
  QueueStatus,
  SystemSettings,
  Direction,
  TikTokLive,
}
export default sequelize
