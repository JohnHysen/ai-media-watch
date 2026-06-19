import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import cfg from '../config'

export default (req: Request, res: Response, next: NextFunction) => {
  console.log('🔥 authMiddleware вызван')
  console.log('req.headers:', req.headers)

  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' })
  }

  try {
    const decoded = jwt.verify(token, cfg.SECRET_KEY)
    ;(req as any).user = decoded
    next()
  } catch (error) {
    console.log(error)
    return res.status(401).json({ error: 'Неверный токен' })
  }
}
