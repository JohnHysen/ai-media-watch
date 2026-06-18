import { Request, Response } from 'express'
import unexpectedError from '../helpers/unexpectedError'
import { AnalysisQueue, QueueStatus } from '../db/models/AnalysisQueue'
import { User } from '../db/models/user'

export const createAnalysisJob = async (req: Request, res: Response) => {
  try {
    const { url } = req.body
    const userId = req.user?.id ?? null

    if (!url) {
      return res.status(400).json({
        ok: false,
        message: 'Некорректная ссылка на видео',
      })
    }

    const existing = await AnalysisQueue.findOne({
      where: {
        url,
        status: [QueueStatus.PENDING, QueueStatus.PROCESSING],
      },
    })
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: 'Это видео уже добавлено в очередь обработки',
      })
    }

    await AnalysisQueue.create({
      url,
      priority: 1,
      userId,
      status: QueueStatus.PENDING,
      platform: 'unknown',
    })

    return res.status(201).json({
      ok: true,
      message: 'Видео добавлено в очередь обработки',
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}

export const getQueue = async (req: Request, res: Response) => {
  try {
    const items = await AnalysisQueue.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['id', 'email'] }],
    })
    res.json(items)
  } catch (e) {
    unexpectedError(res, e)
  }
}
