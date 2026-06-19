import { Router } from 'express'
import {
  createAnalysisJob,
  getQueue,
} from '../controllers/analysisQueueController'
import accessLevel from '../middleware/accessLevel.js'
import authMiddleware from '../middleware/authMiddleware.js' // ← добавляем

const router = Router()

// ✅ POST – теперь с authMiddleware, чтобы получить userId
router.post('/', authMiddleware, createAnalysisJob)

// ✅ GET – только для авторизованных (с accessLevel)
router.get('/', accessLevel(1), getQueue)

export default router
