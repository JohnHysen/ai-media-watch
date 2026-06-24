import sequelize from './db'
import { User } from './models/user'
import { VideoAnalysis } from './models/VideoAnalysis'
import { AnalysisQueue, QueueStatus } from './models/AnalysisQueue'
import { SystemSettings } from './models/SystemSettings'
import { Direction } from './models/Direction'

sequelize.addModels([User, VideoAnalysis, AnalysisQueue, SystemSettings])

export { User, VideoAnalysis, AnalysisQueue, QueueStatus, SystemSettings, Direction }
export default sequelize
