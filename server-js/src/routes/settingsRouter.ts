import { Router } from 'express'
import { getSettings, updateSettings } from '../controllers/settingsController'
import authMiddleware from '../middleware/authMiddleware'
import { requireRole } from '../middleware/checkRoleMiddleware'

const router = Router()

router.get('/', authMiddleware, getSettings)
router.put('/', authMiddleware, requireRole(['ADMIN']), updateSettings)

export default router
