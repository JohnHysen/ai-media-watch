import { Router } from 'express'
import {
  startTiktokLiveProcess,
  stopTiktokLiveProcess,
  getTiktokLiveStatus,
} from '../controllers/tiktokLiveController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/checkRoleMiddleware.js'

const router = Router()

router.get(
  '/status',
  authMiddleware,
  requireRole(['ADMIN']),
  getTiktokLiveStatus
)
router.post(
  '/start',
  authMiddleware,
  requireRole(['ADMIN']),
  startTiktokLiveProcess
)
router.post(
  '/stop',
  authMiddleware,
  requireRole(['ADMIN']),
  stopTiktokLiveProcess
)

export default router
