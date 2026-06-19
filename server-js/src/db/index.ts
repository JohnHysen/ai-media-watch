import sequelize from './db'
import { User } from './models/user'
import { VideoAnalysis } from './models/VideoAnalysis'
import { AnalysisQueue, QueueStatus } from './models/AnalysisQueue'
import { SystemSettings } from './models/SystemSettings' // ✅ добавили

sequelize.addModels([User, VideoAnalysis, AnalysisQueue, SystemSettings]) // ✅ добавили

export { User, VideoAnalysis, AnalysisQueue, QueueStatus, SystemSettings } // ✅ добавили
export default sequelize
