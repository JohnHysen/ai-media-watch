import { Router } from 'express'
import authRouter from './authRouter.js'
import userRouter from './userRouter.js'
import videoRoutes from './videoRoutes.js'
import accessLevel from '../middleware/accessLevel.js'

const router = Router()

router.use('/auth', authRouter)
router.use('/user', accessLevel(1), userRouter)
router.use('/video-analysis', videoRoutes) // подключено

export default router
