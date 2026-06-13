import { Response, Request } from 'express'

import { generateJwt } from '../helpers/generateJwt'
import unexpectedError from '../helpers/unexpectedError'

export const verify = async (req: Request, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }
    return res.json({
      user: req.user,
      token: generateJwt(user.id, user.role),
    })
  } catch (e) {
    return unexpectedError(res, e)
  }
}
