import sequelize from './db'
import { User } from './models/user'
import { VideoAnalysis } from './models/VideoAnalysis'
import { AnalysisQueue, QueueStatus } from './models/AnalysisQueue'
import { SystemSettings } from './models/SystemSettings'
import { FraudResource, ResourceStatus } from './models/FraudResource' // ✅ добавляем

sequelize.addModels([
  User,
  VideoAnalysis,
  AnalysisQueue,
  SystemSettings,
  FraudResource,
]) // ✅ добавляем FraudResource

export {
  User,
  VideoAnalysis,
  AnalysisQueue,
  QueueStatus,
  SystemSettings,
  FraudResource,
  ResourceStatus,
} // ✅ экспортируем
export default sequelize
