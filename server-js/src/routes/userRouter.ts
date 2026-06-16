import { Router } from 'express'
import { verify } from '../controllers/userController'
import authMiddleware from '../middleware/authMiddleware.js'
import { User } from '../db/models.js'

const router = Router()

router.post('/verify', verify)

// GET /user/me – получение текущего пользователя (для фронтенда)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user_id = (req as any).user?.id
    if (!user_id) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    const user = await User.findByPk(user_id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    // Возвращаем данные пользователя и токен
    res.json({
      user: {
        id: user.id,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        // photoURL: user.photoURL || '',
        tg_id: user.tg_id || null,
        is_google: user.is_google || false,
      },
      token: req.headers.authorization?.split(' ')[1],
    })
  } catch (error) {
    console.error('Error in /me:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
