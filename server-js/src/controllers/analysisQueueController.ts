import { Request, Response } from 'express'
import unexpectedError from '../helpers/unexpectedError'
import { AnalysisQueue } from '../db'

export const createAnalysisJob = async (req: Request, res: Response) => {
  try {
    const { url } = req.body

    const userId = req?.user?.id ?? null

    if (!url)
      return res.status(400).json({
        message: 'Некорректная ссылка',
      })

    await AnalysisQueue.create({
      url,
      priority: 1,
      userId,
    })

    return res.status(201).json({
      message: 'Заявка успешно создана!',
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}
