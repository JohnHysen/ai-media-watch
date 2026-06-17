import { Router } from 'express'
import {
  verify,
  getUserStats,
  updateAvatar,
  getUserActivity,
  getVerdictDistribution,
  getRecentChecks,
} from '../controllers/userController'
import authMiddleware from '../middleware/authMiddleware.js'
import accessLevel from '../middleware/accessLevel.js'
import { User } from '../db/models.js'

const router = Router()

router.post('/verify', verify)

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user_id = (req as any).user?.id
    if (!user_id) return res.status(401).json({ error: 'Invalid token' })
    const user = await User.findByPk(user_id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({
      user: {
        id: user.id,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        photoURL: user.photoURL || '',
        is_google: user.is_google || false,
      },
      token: req.headers.authorization?.split(' ')[1],
    })
  } catch (error) {
    console.error('Error in /me:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/stats', accessLevel(1), getUserStats)
router.post('/avatar', accessLevel(1), updateAvatar)
router.get('/activity', accessLevel(1), getUserActivity)
router.get('/verdict-distribution', accessLevel(1), getVerdictDistribution)
router.get('/recent-checks', accessLevel(1), getRecentChecks)

export default router
