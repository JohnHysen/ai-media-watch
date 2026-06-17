import { Router } from 'express'
import authRouter from './authRouter.js'
import userRouter from './userRouter.js'
import videoRoutes from './videoRoutes.js'
import proxyRoutes from './proxyRoutes.js' // <-- импорт
import accessLevel from '../middleware/accessLevel.js'
import newsRoutes from './newsRoutes.js'
import analysisQueueRouter from './analysisQueueRouter.js'

const router = Router()

router.use('/auth', authRouter)
router.use('/user', accessLevel(1), userRouter)
router.use('/video-analysis', videoRoutes)
router.use('/news', newsRoutes)
router.use('/analysis-queue', accessLevel(1), analysisQueueRouter)
router.use('/', proxyRoutes) // <-- подключаем прокси (на корневой путь)

export default router
