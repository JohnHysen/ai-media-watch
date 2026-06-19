import sequelize from './db'
import { User } from './models/user'
import { VideoAnalysis } from './models/VideoAnalysis'
import { AnalysisQueue, QueueStatus } from './models/AnalysisQueue'
import { SystemSettings } from './models/SystemSettings' // ✅ добавлена

sequelize.addModels([User, VideoAnalysis, AnalysisQueue, SystemSettings]) // ✅ добавлена

export { User, VideoAnalysis, AnalysisQueue, QueueStatus, SystemSettings } // ✅ добавлена
export default sequelize
