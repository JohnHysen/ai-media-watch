import { Request, Response, NextFunction } from 'express'

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user
    if (!user) {
      return res.status(401).json({ error: 'Не авторизован' })
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' })
    }
    next()
  }
}
