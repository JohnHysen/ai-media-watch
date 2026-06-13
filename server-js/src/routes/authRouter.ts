import { Router } from 'express'
import {
  getUsers,
  googleAuth,
  signIn,
  signUp,
} from '../controllers/authController'

// @ts-expect-error ????
const router = new Router()

router.post('/signup', signUp)
router.post('/signin', signIn)
router.post('/google', googleAuth)
router.get('/users', getUsers)

export default router
