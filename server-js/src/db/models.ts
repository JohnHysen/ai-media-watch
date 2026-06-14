import sequelize from './db'
import { User } from './models/user'
import { VideoAnalysis } from './models/VideoAnalysis' // добавили

sequelize.addModels([User, VideoAnalysis]) // добавили VideoAnalysis

export { User, VideoAnalysis } // экспортируем обе модели
export default sequelize
