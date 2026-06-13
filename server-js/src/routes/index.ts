// routes/index.ts
import { Router } from 'express'

// Импортируем роутеры
import authRouter from './authRouter.js'
import userRouter from './userRouter.js'

// Middleware доступа
import accessLevel from '../middleware/accessLevel.js'

const router = Router()

router.use('/auth', authRouter)
router.use('/user', accessLevel(1), userRouter)
// router.use('/admin', accessLevel(2), adminRouter)

export default router
