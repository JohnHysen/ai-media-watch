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

// POST – доступен всем авторизованным
router.post('/', authMiddleware, createAnalysisJob)

// GET – только для INSPECTOR и ADMIN
router.get('/', authMiddleware, requireRole(['INSPECTOR', 'ADMIN']), getQueue)

// PUT – обновить приоритет (только INSPECTOR и ADMIN)
router.put(
  '/:id/priority',
  authMiddleware,
  requireRole(['INSPECTOR', 'ADMIN']),
  updatePriority
)

// DELETE – удалить задачу (только INSPECTOR и ADMIN)
router.delete(
  '/:id',
  authMiddleware,
  requireRole(['INSPECTOR', 'ADMIN']),
  deleteQueueItem
)

export default router
