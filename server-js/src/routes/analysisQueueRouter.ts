import { Router } from 'express'
import {
  createAnalysisJob,
  getQueue,
} from '../controllers/analysisQueueController'
import accessLevel from '../middleware/accessLevel.js'

const router = Router()

// ✅ POST – доступен всем (без accessLevel)
router.post('/', createAnalysisJob)

// ✅ GET – только для авторизованных (с accessLevel)
router.get('/', accessLevel(1), getQueue)

export default router
