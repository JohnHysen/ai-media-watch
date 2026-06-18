import sequelize from './db'
import { User } from './models/user'
import { VideoAnalysis } from './models/VideoAnalysis'
import { AnalysisQueue } from './models/AnalysisQueue' // ← добавили

sequelize.addModels([User, VideoAnalysis, AnalysisQueue]) // ← добавили AnalysisQueue

export { User, VideoAnalysis, AnalysisQueue } // ← экспортируем все три модели
export default sequelize
