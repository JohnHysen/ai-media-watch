import sequelize from './db'
import { User } from './models/user'
import { VideoAnalysis } from './models/VideoAnalysis' // добавили
import { AnalysisQueue } from './models/AnalysisQueue'

sequelize.addModels([User, VideoAnalysis, AnalysisQueue]) // добавили VideoAnalysis

export { User, VideoAnalysis, AnalysisQueue } // экспортируем обе модели
