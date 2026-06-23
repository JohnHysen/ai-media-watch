import { Router } from 'express'
import {
  createAnalysisJob,
  getQueue,
  updatePriority,
  deleteQueueItem,
} from '../controllers/analysisQueueController'
import authMiddleware from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/checkRoleMiddleware'

const router = Router()

router.post('/', authMiddleware, createAnalysisJob)

router.get('/', authMiddleware, requireRole(['INSPECTOR', 'ADMIN']), getQueue)

router.put(
  '/:id/priority',
  authMiddleware,
  requireRole(['INSPECTOR', 'ADMIN']),
  updatePriority
)

router.delete(
  '/:id',
  authMiddleware,
  requireRole(['INSPECTOR', 'ADMIN']),
  deleteQueueItem
)

export default router
