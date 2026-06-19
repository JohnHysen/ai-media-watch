import { Router } from 'express'
import {
  getUsers,
  signIn,
  signUp,
  updateUserRole,
} from '../controllers/authController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/checkRoleMiddleware.js'

const router = Router()

router.post('/signup', signUp)
router.post('/signin', signIn)

router.get('/users', authMiddleware, requireRole(['ADMIN']), getUsers)
router.put(
  '/users/:id/role',
  authMiddleware,
  requireRole(['ADMIN']),
  updateUserRole
)

export default router
