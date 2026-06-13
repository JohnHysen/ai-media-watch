import type { User } from '../db/models'

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

export {}
