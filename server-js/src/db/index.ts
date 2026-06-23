import sequelize from './db'
import { User } from './models/user'
import { VideoAnalysis } from './models/VideoAnalysis'
import { AnalysisQueue, QueueStatus } from './models/AnalysisQueue'
import { SystemSettings } from './models/SystemSettings'
sequelize.addModels([User, VideoAnalysis, AnalysisQueue, SystemSettings])

export { User, VideoAnalysis, AnalysisQueue, QueueStatus, SystemSettings }
export default sequelize
