import { Router } from 'express'
import authRouter from './authRouter.js'
import userRouter from './userRouter.js'
import videoRoutes from './videoRoutes.js'
import proxyRoutes from './proxyRoutes.js'
import accessLevel from '../middleware/accessLevel.js'
import newsRoutes from './newsRoutes.js'
import analysisQueueRouter from './analysisQueueRouter.js'
import settingsRouter from './settingsRouter.js'
import directionRouter from './directionRouter.js'

const router = Router()

router.use('/auth', authRouter)
router.use('/user', accessLevel(1), userRouter)
router.use('/video-analysis', videoRoutes)
router.use('/news', newsRoutes)
router.use('/analysis-queue', analysisQueueRouter)
router.use('/settings', settingsRouter)
router.use("/directions", directionRouter)
router.use('/', proxyRoutes)

export default router
