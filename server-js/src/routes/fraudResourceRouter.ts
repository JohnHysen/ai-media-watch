import { Router } from 'express'
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from '../controllers/fraudResourceController'
import authMiddleware from '../middleware/authMiddleware'
import { requireRole } from '../middleware/checkRoleMiddleware'

const router = Router()

// Все маршруты доступны только для INSPECTOR и ADMIN
router.use(authMiddleware, requireRole(['INSPECTOR', 'ADMIN']))

router.get('/', getResources)
router.get('/:id', getResourceById)
router.post('/', createResource)
router.put('/:id', updateResource)
router.delete('/:id', deleteResource)

export default router
