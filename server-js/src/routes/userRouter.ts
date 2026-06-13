import { Router } from 'express'
import { verify } from '../controllers/userController'
import authMiddleware from '../middleware/authMiddleware.js'
import { User } from '../db/models.js'

const router = Router()

router.post('/verify', verify)

// GET /user/balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    // authMiddleware гарантирует, что req.user существует,
    // но на всякий случай проверяем id
    const userId = (req as any).user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token: no user id' })
    }
    const user = await User.findByPk(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ balance: user.balance })
  } catch (error) {
    console.error('Balance error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /user/count – публичный счётчик пользователей
router.get('/count', async (req, res) => {
  try {
    const count = await User.count()
    res.json({ count })
  } catch (error) {
    console.error('Count error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
