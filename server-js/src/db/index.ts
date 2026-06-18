import sequelize from './db'
import { User } from './models/user'
import { VideoAnalysis } from './models/VideoAnalysis'
import { AnalysisQueue, QueueStatus } from './models/AnalysisQueue'

sequelize.addModels([User, VideoAnalysis, AnalysisQueue])

export { User, VideoAnalysis, AnalysisQueue, QueueStatus }
export default sequelize
