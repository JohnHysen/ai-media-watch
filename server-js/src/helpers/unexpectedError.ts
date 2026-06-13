import { Response } from 'express'

const unexpectedError = (res: Response, e: unknown) => {
  console.log(e)
  return res.status(500).json({ message: 'Непредвиденная ошибка!' })
}

export default unexpectedError
