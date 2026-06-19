import { Request, Response } from 'express'
import { AnalysisQueue, QueueStatus } from '../db/models/AnalysisQueue'
import { VideoAnalysis } from '../db/models/VideoAnalysis'
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

    // ✅ 1. СНАЧАЛА ПРОВЕРЯЕМ В ПРОАНАЛИЗИРОВАННЫХ
    const existingAnalysis = await VideoAnalysis.findOne({
      where: { video_url: url },
    })
    if (existingAnalysis) {
      return res.status(409).json({
        ok: false,
        message: 'Это видео уже было проанализировано',
      })
    }

    // ✅ 2. ПОТОМ ПРОВЕРЯЕМ В ОЧЕРЕДИ
    const existingInQueue = await AnalysisQueue.findOne({
      where: {
        url,
        status: [QueueStatus.PENDING, QueueStatus.PROCESSING],
      },
    })
    if (existingInQueue) {
      return res.status(409).json({
        ok: false,
        message: 'Это видео уже в очереди на обработку',
      })
    }

    // ✅ 3. ТОЛЬКО ПОТОМ ДОБАВЛЯЕМ
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
  } catch (error) {
    console.error('❌ Ошибка создания задачи:', error)
    return res.status(500).json({
      ok: false,
      message: 'Внутренняя ошибка сервера',
    })
  }
}

export const getQueue = async (req: Request, res: Response) => {
  try {
    const items = await AnalysisQueue.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['id', 'email'] }],
    })
    res.json(items)
  } catch (error) {
    console.error('❌ Ошибка получения очереди:', error)
    res.status(500).json({
      ok: false,
      message: 'Внутренняя ошибка сервера',
    })
  }
}
