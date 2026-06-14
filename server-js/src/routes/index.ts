import { Router } from 'express'
import authRouter from './authRouter.js'
import userRouter from './userRouter.js'
import videoRoutes from './videoRoutes.js'   // импорт
import accessLevel from '../middleware/accessLevel.js'

const router = Router()

router.use('/auth', authRouter)
router.use('/user', accessLevel(1), userRouter)

// Временно отключаем accessLevel для теста
router.use('/video-analysis', videoRoutes)   // было: accessLevel(1), videoRoutes

export default router